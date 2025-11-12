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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useState } from 'react';
export var IAFileUpload = function (_a) {
    var accept = _a.accept, _b = _a.multiple, multiple = _b === void 0 ? false : _b, maxSize = _a.maxSize, maxFiles = _a.maxFiles, onFileSelect = _a.onFileSelect, onFileUpload = _a.onFileUpload, _c = _a.className, className = _c === void 0 ? '' : _c, _d = _a.disabled, disabled = _d === void 0 ? false : _d, _e = _a.dragAndDrop, dragAndDrop = _e === void 0 ? true : _e, children = _a.children;
    var _f = useState([]), files = _f[0], setFiles = _f[1];
    var _g = useState(false), isDragOver = _g[0], setIsDragOver = _g[1];
    var fileInputRef = React.useRef(null);
    var validateFile = function (file) {
        if (maxSize && file.size > maxSize) {
            return "File size exceeds ".concat((maxSize / 1024 / 1024).toFixed(2), "MB limit");
        }
        return null;
    };
    var generateFileId = function () { return "file-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)); };
    var processFiles = useCallback(function (fileList) {
        var newFiles = Array.from(fileList);
        if (maxFiles && files.length + newFiles.length > maxFiles) {
            alert("Maximum ".concat(maxFiles, " files allowed"));
            return;
        }
        var validFiles = [];
        var uploadFiles = [];
        newFiles.forEach(function (file) {
            var error = validateFile(file);
            var fileUpload = {
                file: file,
                id: generateFileId(),
                status: error ? 'error' : 'pending',
                error: error || undefined
            };
            if (!error) {
                validFiles.push(file);
            }
            uploadFiles.push(fileUpload);
        });
        setFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), uploadFiles, true); });
        onFileSelect === null || onFileSelect === void 0 ? void 0 : onFileSelect(validFiles);
        // Auto-upload if handler provided
        if (onFileUpload) {
            uploadFiles
                .filter(function (f) { return f.status === 'pending'; })
                .forEach(function (uploadFile) {
                handleFileUpload(uploadFile);
            });
        }
    }, [files.length, maxFiles, onFileSelect, onFileUpload]);
    var handleFileUpload = function (uploadFile) { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!onFileUpload)
                        return [2 /*return*/];
                    setFiles(function (prev) { return prev.map(function (f) {
                        return f.id === uploadFile.id
                            ? __assign(__assign({}, f), { status: 'uploading', progress: 0 }) : f;
                    }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, onFileUpload(uploadFile.file)];
                case 2:
                    _a.sent();
                    setFiles(function (prev) { return prev.map(function (f) {
                        return f.id === uploadFile.id
                            ? __assign(__assign({}, f), { status: 'complete', progress: 100 }) : f;
                    }); });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    setFiles(function (prev) { return prev.map(function (f) {
                        return f.id === uploadFile.id
                            ? __assign(__assign({}, f), { status: 'error', error: error_1 instanceof Error ? error_1.message : 'Upload failed' }) : f;
                    }); });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleFileInputChange = function (event) {
        var fileList = event.target.files;
        if (fileList) {
            processFiles(fileList);
        }
    };
    var handleDragOver = function (event) {
        event.preventDefault();
        if (!disabled && dragAndDrop) {
            setIsDragOver(true);
        }
    };
    var handleDragLeave = function (event) {
        event.preventDefault();
        setIsDragOver(false);
    };
    var handleDrop = function (event) {
        event.preventDefault();
        setIsDragOver(false);
        if (disabled || !dragAndDrop)
            return;
        var fileList = event.dataTransfer.files;
        if (fileList) {
            processFiles(fileList);
        }
    };
    var handleClick = function () {
        var _a;
        if (!disabled) {
            (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click();
        }
    };
    var removeFile = function (fileId) {
        setFiles(function (prev) { return prev.filter(function (f) { return f.id !== fileId; }); });
    };
    var baseClasses = 'ia-file-upload';
    var dragOverClasses = isDragOver ? 'ia-file-upload--drag-over' : '';
    var disabledClasses = disabled ? 'ia-file-upload--disabled' : '';
    var hasFilesClasses = files.length > 0 ? 'ia-file-upload--has-files' : '';
    var containerClasses = [
        baseClasses,
        dragOverClasses,
        disabledClasses,
        hasFilesClasses,
        className
    ].filter(Boolean).join(' ');
    return (_jsxs("div", { className: containerClasses, children: [_jsxs("div", { className: "ia-file-upload__dropzone", onClick: handleClick, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, role: "button", tabIndex: disabled ? -1 : 0, "aria-label": "File upload area", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: accept, multiple: multiple, onChange: handleFileInputChange, className: "ia-file-upload__input", disabled: disabled }), children || (_jsxs("div", { className: "ia-file-upload__content", children: [_jsx("div", { className: "ia-file-upload__icon", children: "\uD83D\uDCCE" }), _jsxs("div", { className: "ia-file-upload__text", children: [_jsx("p", { className: "ia-file-upload__primary", children: dragAndDrop ? 'Drop files here or click to browse' : 'Click to browse files' }), _jsxs("p", { className: "ia-file-upload__secondary", children: [accept && "Accepted formats: ".concat(accept), maxSize && " \u2022 Max size: ".concat((maxSize / 1024 / 1024).toFixed(2), "MB")] })] })] }))] }), files.length > 0 && (_jsx("div", { className: "ia-file-upload__files", children: files.map(function (file) { return (_jsxs("div", { className: "ia-file-upload__file ia-file-upload__file--".concat(file.status), children: [_jsxs("div", { className: "ia-file-upload__file-info", children: [_jsx("span", { className: "ia-file-upload__file-name", children: file.file.name }), _jsxs("span", { className: "ia-file-upload__file-size", children: [(file.file.size / 1024).toFixed(1), " KB"] })] }), file.status === 'uploading' && file.progress !== undefined && (_jsx("div", { className: "ia-file-upload__progress", children: _jsx("div", { className: "ia-file-upload__progress-bar", style: { width: "".concat(file.progress, "%") } }) })), file.error && (_jsx("div", { className: "ia-file-upload__error", children: file.error })), _jsx("button", { className: "ia-file-upload__remove", onClick: function () { return removeFile(file.id); }, "aria-label": "Remove ".concat(file.file.name), children: "\u00D7" })] }, file.id)); }) }))] }));
};
