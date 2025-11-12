import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var IAChatMessage = function (_a) {
    var children = _a.children, role = _a.role, source = _a.source, timestamp = _a.timestamp, avatar = _a.avatar, actions = _a.actions, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.loading, loading = _c === void 0 ? false : _c;
    var baseClasses = 'ia-chat-message';
    var roleClasses = "ia-chat-message--".concat(role);
    var sourceClasses = source ? "ia-chat-message--".concat(source) : '';
    var loadingClasses = loading ? 'ia-chat-message--loading' : '';
    var messageClasses = [
        baseClasses,
        roleClasses,
        sourceClasses,
        loadingClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsx("div", { className: messageClasses, children: _jsxs("div", { className: "ia-chat-message__container", children: [avatar && (_jsx("div", { className: "ia-chat-message__avatar", children: avatar })), _jsxs("div", { className: "ia-chat-message__main", children: [(timestamp || source) && (_jsxs("div", { className: "ia-chat-message__meta", children: [source && (_jsx("span", { className: "ia-chat-message__source ia-chat-message__source--".concat(source), children: source === 'work' ? 'Work' : source === 'web' ? 'Web' : 'Compare' })), timestamp && (_jsx("span", { className: "ia-chat-message__timestamp", children: timestamp.toLocaleTimeString() }))] })), _jsxs("div", { className: "ia-chat-message__bubble", children: [_jsx("div", { className: "ia-chat-message__content", children: loading ? (_jsxs("div", { className: "ia-chat-message__loading", children: [_jsx("span", { className: "ia-chat-message__dot" }), _jsx("span", { className: "ia-chat-message__dot" }), _jsx("span", { className: "ia-chat-message__dot" })] })) : (children) }), actions && !loading && (_jsx("div", { className: "ia-chat-message__actions", children: actions }))] })] })] }) }));
};
