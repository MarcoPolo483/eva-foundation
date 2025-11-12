import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export var IAPanel = function (_a) {
    var children = _a.children, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.className, className = _c === void 0 ? '' : _c, title = _a.title, subtitle = _a.subtitle, actions = _a.actions, _d = _a.collapsible, collapsible = _d === void 0 ? false : _d, _e = _a.defaultExpanded, defaultExpanded = _e === void 0 ? true : _e, onExpandChange = _a.onExpandChange;
    var _f = React.useState(defaultExpanded), isExpanded = _f[0], setIsExpanded = _f[1];
    var handleToggleExpand = function () {
        var newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        onExpandChange === null || onExpandChange === void 0 ? void 0 : onExpandChange(newExpanded);
    };
    var baseClasses = 'ia-panel';
    var variantClasses = "ia-panel--".concat(variant);
    var expandedClasses = isExpanded ? 'ia-panel--expanded' : 'ia-panel--collapsed';
    var panelClasses = [
        baseClasses,
        variantClasses,
        collapsible ? expandedClasses : '',
        className
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: panelClasses, children: [(title || subtitle || actions || collapsible) && (_jsxs("div", { className: "ia-panel__header", children: [_jsxs("div", { className: "ia-panel__header-content", children: [title && (_jsxs("h3", { className: "ia-panel__title", children: [collapsible && (_jsx("button", { className: "ia-panel__toggle", onClick: handleToggleExpand, "aria-expanded": isExpanded, "aria-label": isExpanded ? 'Collapse panel' : 'Expand panel', children: _jsx("span", { className: "ia-panel__toggle-icon ".concat(isExpanded ? 'ia-panel__toggle-icon--expanded' : ''), children: "\u25B6" }) })), _jsx("span", { className: "ia-panel__title-text", children: title })] })), subtitle && (_jsx("p", { className: "ia-panel__subtitle", children: subtitle }))] }), actions && (_jsx("div", { className: "ia-panel__actions", children: actions }))] })), (!collapsible || isExpanded) && (_jsx("div", { className: "ia-panel__content", children: children }))] }));
};
