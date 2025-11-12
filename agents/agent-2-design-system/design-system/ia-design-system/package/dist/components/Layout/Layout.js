import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var IALayout = function (_a) {
    var children = _a.children, header = _a.header, sidebar = _a.sidebar, footer = _a.footer, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.sidebarCollapsed, sidebarCollapsed = _c === void 0 ? false : _c, onSidebarToggle = _a.onSidebarToggle;
    var baseClasses = 'ia-layout';
    var collapsedClasses = sidebarCollapsed ? 'ia-layout--sidebar-collapsed' : '';
    var hasSidebarClasses = sidebar ? 'ia-layout--has-sidebar' : '';
    var layoutClasses = [
        baseClasses,
        collapsedClasses,
        hasSidebarClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: layoutClasses, children: [header && (_jsxs("header", { className: "ia-layout__header", children: [sidebar && onSidebarToggle && (_jsx("button", { className: "ia-layout__sidebar-toggle", onClick: onSidebarToggle, "aria-label": sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar', children: _jsx("span", { className: "ia-layout__sidebar-toggle-icon", children: sidebarCollapsed ? '☰' : '✕' }) })), _jsx("div", { className: "ia-layout__header-content", children: header })] })), _jsxs("div", { className: "ia-layout__body", children: [sidebar && (_jsx("aside", { className: "ia-layout__sidebar", children: _jsx("div", { className: "ia-layout__sidebar-content", children: sidebar }) })), _jsx("main", { className: "ia-layout__main", children: _jsx("div", { className: "ia-layout__content", children: children }) })] }), footer && (_jsx("footer", { className: "ia-layout__footer", children: footer }))] }));
};
