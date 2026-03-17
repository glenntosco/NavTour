window.clickElement = function (id) {
    var el = document.getElementById(id);
    if (el) el.click();
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
