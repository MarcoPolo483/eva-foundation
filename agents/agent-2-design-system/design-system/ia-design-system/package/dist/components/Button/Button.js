var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var IAButton = function (_a) {
    var _b = _a.variant, variant = _b === void 0 ? 'primary' : _b, _c = _a.size, size = _c === void 0 ? 'md' : _c, children = _a.children, _d = _a.loading, loading = _d === void 0 ? false : _d, icon = _a.icon, _e = _a.iconPosition, iconPosition = _e === void 0 ? 'left' : _e, _f = _a.className, className = _f === void 0 ? '' : _f, disabled = _a.disabled, props = __rest(_a, ["variant", "size", "children", "loading", "icon", "iconPosition", "className", "disabled"]);
    var baseClasses = 'ia-button';
    var variantClasses = "ia-button--".concat(variant);
    var sizeClasses = "ia-button--".concat(size);
    var loadingClasses = loading ? 'ia-button--loading' : '';
    var disabledClasses = (disabled || loading) ? 'ia-button--disabled' : '';
    var buttonClasses = [
        baseClasses,
        variantClasses,
        sizeClasses,
        loadingClasses,
        disabledClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsxs("button", __assign({ className: buttonClasses, disabled: disabled || loading }, props, { children: [loading && _jsx("span", { className: "ia-button__spinner" }), icon && iconPosition === 'left' && !loading && (_jsx("span", { className: "ia-button__icon ia-button__icon--left", children: icon })), _jsx("span", { className: "ia-button__text", children: children }), icon && iconPosition === 'right' && !loading && (_jsx("span", { className: "ia-button__icon ia-button__icon--right", children: icon }))] })));
};
