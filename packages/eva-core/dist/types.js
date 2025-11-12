"use strict";
/**
 * EVA Foundation - Core Types and Interfaces
 * Shared across all EVA ecosystem components
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.UserRole = void 0;
// =============================================================================
// SECURITY & RBAC TYPES
// =============================================================================
/** User roles in the EVA system */
var UserRole;
(function (UserRole) {
    UserRole["GLOBAL_ADMIN"] = "global_admin";
    UserRole["TENANT_ADMIN"] = "tenant_admin";
    UserRole["PROJECT_OWNER"] = "project_owner";
    UserRole["PROJECT_MEMBER"] = "project_member";
    UserRole["END_USER"] = "end_user";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
/** Permissions for fine-grained access control */
var Permission;
(function (Permission) {
    // Project permissions
    Permission["PROJECT_CREATE"] = "project:create";
    Permission["PROJECT_READ"] = "project:read";
    Permission["PROJECT_UPDATE"] = "project:update";
    Permission["PROJECT_DELETE"] = "project:delete";
    // Document permissions
    Permission["DOCUMENT_UPLOAD"] = "document:upload";
    Permission["DOCUMENT_READ"] = "document:read";
    Permission["DOCUMENT_DELETE"] = "document:delete";
    // Chat permissions
    Permission["CHAT_CREATE"] = "chat:create";
    Permission["CHAT_READ"] = "chat:read";
    Permission["CHAT_HISTORY"] = "chat:history";
    // Admin permissions
    Permission["USER_MANAGE"] = "user:manage";
    Permission["TENANT_MANAGE"] = "tenant:manage";
    Permission["SYSTEM_ADMIN"] = "system:admin";
})(Permission = exports.Permission || (exports.Permission = {}));
// Export constants for use in utils and other packages
__exportStar(require("./constants.js"), exports);
//# sourceMappingURL=types.js.map