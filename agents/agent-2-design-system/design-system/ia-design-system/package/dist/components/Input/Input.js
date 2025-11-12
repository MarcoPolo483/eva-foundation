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
export var IAInput = function (_a) {
    var label = _a.label, error = _a.error, helperText = _a.helperText, _b = _a.size, size = _b === void 0 ? 'md' : _b, _c = _a.variant, variant = _c === void 0 ? 'default' : _c, leftIcon = _a.leftIcon, rightIcon = _a.rightIcon, _d = _a.loading, loading = _d === void 0 ? false : _d, _e = _a.className, className = _e === void 0 ? '' : _e, disabled = _a.disabled, id = _a.id, props = __rest(_a, ["label", "error", "helperText", "size", "variant", "leftIcon", "rightIcon", "loading", "className", "disabled", "id"]);
    var inputId = id || "ia-input-".concat(Math.random().toString(36).substr(2, 9));
    var baseClasses = 'ia-input';
    var sizeClasses = "ia-input--".concat(size);
    var variantClasses = "ia-input--".concat(variant);
    var errorClasses = error ? 'ia-input--error' : '';
    var disabledClasses = (disabled || loading) ? 'ia-input--disabled' : '';
    var hasIconClasses = (leftIcon || rightIcon) ? 'ia-input--has-icons' : '';
    var containerClasses = [
        baseClasses,
        sizeClasses,
        variantClasses,
        errorClasses,
        disabledClasses,
        hasIconClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: containerClasses, children: [label && (_jsx("label", { htmlFor: inputId, className: "ia-input__label", children: label })), _jsxs("div", { className: "ia-input__container", children: [leftIcon && (_jsx("div", { className: "ia-input__icon ia-input__icon--left", children: leftIcon })), _jsx("input", __assign({ id: inputId, className: "ia-input__field", disabled: disabled || loading }, props)), loading && (_jsx("div", { className: "ia-input__icon ia-input__icon--right", children: _jsx("div", { className: "ia-input__spinner" }) })), rightIcon && !loading && (_jsx("div", { className: "ia-input__icon ia-input__icon--right", children: rightIcon }))] }), (error || helperText) && (_jsx("div", { className: "ia-input__help", children: error ? (_jsx("span", { className: "ia-input__error", children: error })) : (_jsx("span", { className: "ia-input__helper-text", children: helperText })) }))] }));
};
