#!/usr/bin/env python3
"""
Knowledge Base Ingestion Helper Script

Uploads AssistMe XML to Azure Blob Storage and triggers the ingestion function.

Usage:
    python ingest_knowledge_base.py --xml-file ./knowledge_articles_r2r3_en.xml
    
Requirements:
    pip install azure-storage-blob azure-identity requests python-dotenv
"""

import os
import sys
import json
import argparse
import time
from pathlib import Path
from typing import Dict, Any, Optional

try:
    from azure.storage.blob import BlobServiceClient
    from azure.identity import DefaultAzureCredential
    import requests
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("Install with: pip install azure-storage-blob azure-identity requests python-dotenv")
    sys.exit(1)

# ============================================================================
# Configuration
# ============================================================================

load_dotenv()

STORAGE_ACCOUNT = os.getenv('STORAGE_ACCOUNT', 'evafoundationstorage')
CONTAINER_NAME = os.getenv('KNOWLEDGE_CONTAINER', 'knowledge-sources')
FUNCTION_APP = os.getenv('FUNCTION_APP', 'eva-foundation-functions')
FUNCTION_KEY = os.getenv('FUNCTION_KEY', '')
TENANT_ID = os.getenv('TENANT_ID', 'government-canada')

# ============================================================================
# Helper Functions
# ============================================================================

def upload_to_blob_storage(
    xml_file_path: str,
    blob_name: Optional[str] = None
) -> str:
    """
    Upload XML file to Azure Blob Storage
    
    Args:
        xml_file_path: Path to XML file
        blob_name: Name for blob (defaults to filename)
        
    Returns:
        Blob name
    """
    print(f"📤 Uploading {xml_file_path} to Blob Storage...")
    
    if not os.path.exists(xml_file_path):
        raise FileNotFoundError(f"XML file not found: {xml_file_path}")
    
    # Default blob name to filename
    if blob_name is None:
        blob_name = Path(xml_file_path).name
    
    # Initialize blob client with Managed Identity
    try:
        credential = DefaultAzureCredential()
        blob_service_client = BlobServiceClient(
            account_url=f"https://{STORAGE_ACCOUNT}.blob.core.windows.net",
            credential=credential
        )
        print(f"✓ Connected to storage account: {STORAGE_ACCOUNT}")
    except Exception as e:
        print(f"❌ Failed to connect to storage account: {e}")
        print("Make sure you're authenticated with: az login")
        raise
    
    # Get container client
    container_client = blob_service_client.get_container_client(CONTAINER_NAME)
    
    # Create container if it doesn't exist
    try:
        if not container_client.exists():
            print(f"Creating container: {CONTAINER_NAME}")
            container_client.create_container()
    except Exception as e:
        print(f"⚠️  Container check/creation warning: {e}")
    
    # Upload file
    blob_client = container_client.get_blob_client(blob_name)
    
    file_size = os.path.getsize(xml_file_path)
    print(f"📦 File size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
    
    with open(xml_file_path, 'rb') as data:
        blob_client.upload_blob(data, overwrite=True)
    
    print(f"✅ Uploaded to: {CONTAINER_NAME}/{blob_name}")
    return blob_name


def trigger_ingestion(
    blob_name: str,
    tenant_id: str = TENANT_ID,
    abgr_only: bool = False,
    function_url: Optional[str] = None,
    function_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Trigger knowledge ingestion function
    
    Args:
        blob_name: Name of blob in storage
        tenant_id: Tenant identifier
        abgr_only: Filter to ABGR-relevant articles only
        function_url: Override function URL
        function_key: Override function key
        
    Returns:
        Response JSON
    """
    print(f"\n🚀 Triggering ingestion function...")
    
    # Build function URL
    if function_url is None:
        function_url = f"https://{FUNCTION_APP}.azurewebsites.net/api/knowledge-ingestion"
    
    if function_key is None:
        function_key = FUNCTION_KEY
    
    # Build request payload
    payload = {
        "tenantId": tenant_id,
        "blobName": blob_name,
        "containerName": CONTAINER_NAME,
        "abgrOnly": abgr_only
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-functions-key": function_key
    }
    
    print(f"📍 Function URL: {function_url}")
    print(f"📦 Payload: {json.dumps(payload, indent=2)}")
    
    # Make request
    try:
        response = requests.post(
            function_url,
            json=payload,
            headers=headers,
            timeout=300  # 5 minute timeout for large files
        )
        
        response.raise_for_status()
        result = response.json()
        
        return result
        
    except requests.exceptions.Timeout:
        print("⏱️  Request timed out (ingestion may still be processing)")
        return {"error": "timeout", "message": "Check Azure portal for function execution logs"}
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                print(f"Response text: {e.response.text}")
        raise


def print_ingestion_summary(result: Dict[str, Any]):
    """
    Pretty-print ingestion results
    """
    print("\n" + "="*80)
    print("📊 INGESTION SUMMARY")
    print("="*80)
    
    if result.get('success'):
        summary = result.get('summary', {})
        abgr_stats = result.get('abgr_stats', {})
        
        print(f"\n✅ Status: SUCCESS")
        print(f"⏱️  Duration: {summary.get('durationMs', 0):,} ms")
        print(f"\n📚 Articles:")
        print(f"   Total in XML:    {summary.get('totalArticles', 0):>6}")
        print(f"   Transformed:     {summary.get('transformed', 0):>6}")
        print(f"   Skipped:         {summary.get('skipped', 0):>6}")
        print(f"   Ingested:        {summary.get('ingested', 0):>6}")
        print(f"   Succeeded:       {summary.get('succeeded', 0):>6}")
        print(f"   Failed:          {summary.get('failed', 0):>6}")
        
        if summary.get('abgrFiltered'):
            print(f"\n🎯 ABGR Filter: ENABLED (only ABGR-relevant articles)")
        
        print(f"\n🤖 ABGR Statistics:")
        print(f"   Relevant Articles: {abgr_stats.get('relevant', 0)}")
        
        categories = abgr_stats.get('categories', {})
        if categories:
            print(f"\n   Categories:")
            for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                print(f"      {category:20} {count:>4}")
        
        agent_types = abgr_stats.get('agentTypes', {})
        if agent_types:
            print(f"\n   Agent Types:")
            for agent_type, count in sorted(agent_types.items(), key=lambda x: x[1], reverse=True):
                print(f"      {agent_type:30} {count:>4}")
        
        errors = result.get('errors', [])
        if errors:
            print(f"\n⚠️  Errors (showing first 5):")
            for error in errors[:5]:
                print(f"   • {error}")
        
        print(f"\n💬 Message: {result.get('message', 'N/A')}")
        
    else:
        print(f"\n❌ Status: FAILED")
        print(f"💬 Error: {result.get('error', 'Unknown error')}")
    
    print("\n" + "="*80)


def analyze_xml_structure(xml_file_path: str):
    """
    Analyze XML structure without uploading
    """
    print(f"🔍 Analyzing XML structure: {xml_file_path}")
    
    try:
        import xml.etree.ElementTree as ET
        
        tree = ET.parse(xml_file_path)
        root = tree.getroot()
        
        print(f"\n📄 Root element: <{root.tag}>")
        print(f"   Attributes: {root.attrib}")
        
        # Find all unique element types
        all_elements = set()
        for elem in root.iter():
            all_elements.add(elem.tag)
        
        print(f"\n📋 All element types ({len(all_elements)}):")
        for elem_type in sorted(all_elements):
            count = len(root.findall(f".//{elem_type}"))
            print(f"   {elem_type:30} ({count} occurrences)")
        
        # Sample first article
        articles = root.findall('.//article') or root.findall('.//item') or []
        if articles:
            print(f"\n📰 Sample article structure:")
            sample = articles[0]
            for child in sample:
                value_preview = (child.text or '')[:50].replace('\n', ' ')
                print(f"   <{child.tag}>: {value_preview}...")
        
        print(f"\n✓ Analysis complete")
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        raise


# ============================================================================
# Main Script
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Upload and ingest AssistMe XML knowledge base',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload and ingest all articles
  python ingest_knowledge_base.py --xml-file ./knowledge_articles_r2r3_en.xml
  
  # Upload and ingest only ABGR-relevant articles
  python ingest_knowledge_base.py --xml-file ./knowledge_articles_r2r3_en.xml --abgr-only
  
  # Analyze XML structure without uploading
  python ingest_knowledge_base.py --xml-file ./knowledge_articles_r2r3_en.xml --analyze-only
  
  # Upload only (no ingestion)
  python ingest_knowledge_base.py --xml-file ./knowledge_articles_r2r3_en.xml --upload-only
        """
    )
    
    parser.add_argument(
        '--xml-file',
        required=True,
        help='Path to AssistMe XML file'
    )
    
    parser.add_argument(
        '--tenant-id',
        default=TENANT_ID,
        help=f'Tenant identifier (default: {TENANT_ID})'
    )
    
    parser.add_argument(
        '--abgr-only',
        action='store_true',
        help='Only ingest ABGR-relevant articles'
    )
    
    parser.add_argument(
        '--blob-name',
        help='Custom blob name (defaults to filename)'
    )
    
    parser.add_argument(
        '--analyze-only',
        action='store_true',
        help='Analyze XML structure without uploading'
    )
    
    parser.add_argument(
        '--upload-only',
        action='store_true',
        help='Upload to blob storage without triggering ingestion'
    )
    
    parser.add_argument(
        '--function-url',
        help='Override function URL'
    )
    
    parser.add_argument(
        '--function-key',
        help='Override function key'
    )
    
    args = parser.parse_args()
    
    # Analyze only mode
    if args.analyze_only:
        analyze_xml_structure(args.xml_file)
        return
    
    # Upload to blob storage
    start_time = time.time()
    
    try:
        blob_name = upload_to_blob_storage(args.xml_file, args.blob_name)
        
        upload_duration = time.time() - start_time
        print(f"⏱️  Upload duration: {upload_duration:.2f} seconds")
        
        # Upload only mode
        if args.upload_only:
            print(f"\n✅ Upload complete. Blob name: {blob_name}")
            print(f"To trigger ingestion manually, use:")
            print(f"  python ingest_knowledge_base.py --xml-file {args.xml_file} --trigger-only")
            return
        
        # Trigger ingestion
        result = trigger_ingestion(
            blob_name=blob_name,
            tenant_id=args.tenant_id,
            abgr_only=args.abgr_only,
            function_url=args.function_url,
            function_key=args.function_key
        )
        
        # Print summary
        print_ingestion_summary(result)
        
        total_duration = time.time() - start_time
        print(f"\n⏱️  Total duration: {total_duration:.2f} seconds")
        
        # Exit code based on success
        sys.exit(0 if result.get('success') else 1)
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
