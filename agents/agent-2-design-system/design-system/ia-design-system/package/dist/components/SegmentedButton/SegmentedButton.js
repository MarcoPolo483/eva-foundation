import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export var IASegmentedButton = function (_a) {
    var options = _a.options, selectedKey = _a.selectedKey, onChange = _a.onChange, _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.disabled, disabled = _c === void 0 ? false : _c, _d = _a.size, size = _d === void 0 ? 'md' : _d;
    var handleOptionClick = function (key, optionDisabled) {
        if (!disabled && !optionDisabled && onChange) {
            onChange(key);
        }
    };
    var baseClasses = 'ia-segmented-button';
    var sizeClasses = "ia-segmented-button--".concat(size);
    var disabledClasses = disabled ? 'ia-segmented-button--disabled' : '';
    var containerClasses = [
        baseClasses,
        sizeClasses,
        disabledClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsx("div", { className: containerClasses, role: "radiogroup", children: options.map(function (option, index) {
            var isSelected = selectedKey === option.key;
            var isDisabled = disabled || option.disabled;
            var isFirst = index === 0;
            var isLast = index === options.length - 1;
            var optionClasses = [
                'ia-segmented-button__option',
                isSelected ? 'ia-segmented-button__option--selected' : '',
                isDisabled ? 'ia-segmented-button__option--disabled' : '',
                isFirst ? 'ia-segmented-button__option--first' : '',
                isLast ? 'ia-segmented-button__option--last' : ''
            ].filter(Boolean).join(' ');
            return (_jsxs("button", { className: optionClasses, onClick: function () { return handleOptionClick(option.key, option.disabled); }, disabled: isDisabled, role: "radio", "aria-checked": isSelected, "aria-label": option.text, children: [option.iconProps && (_jsx("span", { className: "ia-segmented-button__icon", children: option.iconProps })), _jsx("span", { className: "ia-segmented-button__text", children: option.text })] }, option.key));
        }) }));
};
