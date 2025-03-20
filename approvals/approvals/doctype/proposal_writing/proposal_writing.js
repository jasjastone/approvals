// Copyright (c) 2025, jasjastone and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Proposal Writing", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Sales Order', {
    on_submit: function (frm) {
        // console.log('reloaded doc on submit')
        location.reload()
    },
    onload_post_render: function (frm) {
        var bt = ['Delivery', 'Work Order', 'Invoice', 'Material Request', 'Request for Raw Materials', 'Purchase Order', 'Payment Request', 'Payment', 'Project', 'Subscription']
        bt.forEach(function (bt) {
            frm.page.remove_inner_button(bt, 'Create')
        });
        frm.page.add_inner_button('Order Raw Materials', () => cur_frm.cscript.make_raw_material_request(), 'Create')
    }
}
);
