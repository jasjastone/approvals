// Copyright (c) 2025, jasjastone and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Proposal Writing", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on('Proposal Writing', {
    // on_submit: function (frm) {
    //     // console.log('reloaded doc on submit')
    //     location.reload()
    // },
    refresh(frm) {
        var me = this;
        if (frm.doc.docstatus == 1) {
            console.log(frm.doc.approvers[0].approver == frappe.session.user);
            if (frm.doc.custom_status == "Submitted") {
                for (let i = 0; i < frm.doc.approvers.length; i++) {
                    const approver = frm.doc.approvers[i];
                    if (approver.approver == frappe.session.user && approver.status == "New") {
                        frm.add_custom_button('Approve', () => frappe.call({
                            method: "approvals.api.approve",
                            args: { doc: frm.doc.name },
                            callback: function (r) {
                            },
                        }),);
                        frm.add_custom_button('Reject', () => frappe.call({
                            method: "approvals.api.reject",
                            args: { doc: frm.doc.name },
                            callback: function (r) {
                            },
                        }),);
                    }
                }
            }
        }

        if (frm.doc.custom_status == "Approved") {
            frm.add_custom_button(__('Convert to PO'), me.conver_to_po,);
        }
    },
    conver_to_po() {
        frappe.model.open_mapped_doc({
            method: "approvals.api.convert_to_po",
            frm: curl_frm,
            freeze_message: __("Creating Purchase Order ...")
        });
    }

}
);
