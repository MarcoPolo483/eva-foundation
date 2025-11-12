#!/usr/bin/env python3
"""
Test script for EVA Foundation MCP Server
Tests the basic functionality without requiring stdio setup
"""

import asyncio
from hello_mcp import EVAMCPServer

async def test_mcp_server():
    """Test the EVA MCP server functionality"""
    print("🧪 Testing EVA Foundation MCP Server...")
    
    # Create server instance (without stdio)
    server = EVAMCPServer()
    
    # Test knowledge base reading
    print("\n📚 Testing knowledge base access...")
    kb_content = await server._read_full_knowledge_base()
    print(f"Knowledge base: {kb_content}")
    
    # Test ABGR content extraction
    print("\n🤖 Testing ABGR content extraction...")
    abgr_content = await server._extract_abgr_content()
    print(f"ABGR content: {abgr_content[:200]}...")
    
    # Test search functionality
    print("\n🔍 Testing jurisprudence search...")
    search_results = await server._search_jurisprudence(
        query="agent regulations", 
        agent_focus=True, 
        max_results=2
    )
    print(f"Search results: {search_results}")
    
    # Test citation extraction
    print("\n📖 Testing citation extraction...")
    citation_results = await server._extract_citations(
        "According to the Public Service Act, section 45..."
    )
    print(f"Citations: {citation_results}")
    
    # Test ABGR summary
    print("\n📋 Testing ABGR summary...")
    abgr_summary = await server._get_abgr_summary("compliance")
    print(f"ABGR summary: {abgr_summary}")
    
    print("\n✅ EVA MCP Server test completed successfully!")
    print("🚀 Ready for integration with EVA Foundation!")

if __name__ == "__main__":
    asyncio.run(test_mcp_server())
