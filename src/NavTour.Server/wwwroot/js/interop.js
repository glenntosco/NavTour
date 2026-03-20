window.clickElement = function (id) {
    var el = document.getElementById(id);
    if (el) el.click();
};

window.annotationDrag = {
    getParentSize: function (el) {
        var parent = el ? el.parentElement : null;
        if (parent) return [parent.offsetWidth, parent.offsetHeight];
        return [1200, 700];
    }
};

window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text);
};

window.tourInterop = {
    isCompleted: function () {
        return localStorage.getItem("navtour_tour_completed") === "true";
    },
    markCompleted: function () {
        localStorage.setItem("navtour_tour_completed", "true");
    },
    reset: function () {
        localStorage.removeItem("navtour_tour_completed");
    },
    getElementRect: function (selector) {
        var el = document.querySelector(selector);
        if (!el) return null;
        var rect = el.getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }
};

window.authStorage = {
    save: function (token, tenantId) {
        localStorage.setItem("navtour_token", token);
        localStorage.setItem("navtour_tenant", tenantId);
    },
    load: function () {
        var token = localStorage.getItem("navtour_token");
        var tenantId = localStorage.getItem("navtour_tenant");
        if (token && tenantId) return { token: token, tenantId: tenantId };
        return null;
    },
    clear: function () {
        localStorage.removeItem("navtour_token");
        localStorage.removeItem("navtour_tenant");
    }
};
