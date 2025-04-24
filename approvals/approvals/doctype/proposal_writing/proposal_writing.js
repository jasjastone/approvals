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
    refresh: function (frm) {
        // For Approve/Reject buttons
        if (frm.doc.docstatus == 1) {
            if (frm.doc.status == "Submitted" || frm.doc.status == "Pending Approval") {
                // Check if current user is an approver
                let current_user_is_approver = false;
                for (let i = 0; i < frm.doc.approvers.length; i++) {
                    const approver = frm.doc.approvers[i];
                    if (approver.approver == frappe.session.user && approver.status == "New") {
                        current_user_is_approver = true;
                        break;
                    }
                }
                frappe.db.get_doc("User", frappe.session.user).then(doc => console.log(doc))
                // Only show buttons if user is an approver
                if (current_user_is_approver) {
                    frm.add_custom_button('Approve', function () {
                        frappe.call({
                            method: "approvals.api.approve_reject",
                            args: { doc: frm.doc.name, action: 1 },
                            callback: function (r) {
                                frm.reload_doc();
                            }
                        });
                    });

                    frm.add_custom_button('Reject', function () {
                        frappe.call({
                            method: "approvals.api.approve_reject",
                            args: { doc: frm.doc.name, action: 0 },
                            callback: function (r) {
                                frm.reload_doc();
                            }
                        });
                    });
                }
            }

            // For Convert to PO button - should be inside docstatus==1 check
            if (frm.doc.custom_status == "Approved") {
                frm.add_custom_button(__('Convert to PO'), function () {
                    // Define the conversion function here
                    convert_to_po(frm);
                });
            }
        }
    },
    tax_amount(frm) {
        calculate_tax_grand_total(frm)
    }
    , tax(frm) {
        calculate_tax_grand_total(frm)
    }
}
);
function conver_to_po(frm) {
    frappe.model.open_mapped_doc({
        method: "approvals.api.convert_to_po",
        frm: frm,
        freeze_message: __("Creating Purchase Order ...")
    });
}
frappe.ui.form.on("Proposal Product", {
    refresh: function (frm) {
        frm.set_query("approver", function () {

            return {
                filters: [
                    ["User", "name", "!=", "eval: frappe.session.user"]
                ]
            };
        });
    },
    item_code(frm, cdt, cdn) {
        let proposal_product = frappe.get_doc(cdt, cdn);
        frappe.db.get_doc("Item", proposal_product.item_code).then(doc => {
            frappe.model.set_value(cdt, cdn, "item_name", doc.item_name)
            frappe.model.set_value(cdt, cdn, "uom", doc.stock_uom)
            if (!doc.is_stock_item) {
                frappe.model.set_value(cdt, cdn, "unit_price", doc.standard_rate)
            }
            else {
                frappe.model.set_value(cdt, cdn, "unit_price", doc.valuation_rate)
            }
            frappe.model.set_value(cdt, cdn, "quantity", 1)
            update_total_on_qty_unit_price_change(frm, cdt, cdn)
        });
    },
    quantity(frm, cdt, cdn) {
        update_total_on_qty_unit_price_change(frm, cdt, cdn)
    },
    unit_price(frm, cdt, cdn) {
        update_total_on_qty_unit_price_change(frm, cdt, cdn)
    },


})
function update_total_on_qty_unit_price_change(frm, cdt, cdn) {
    let proposal_product = frappe.get_doc(cdt, cdn)
    frappe.model.set_value(cdt, cdn, 'sub_total', proposal_product.quantity * proposal_product.unit_price);
    calculate_tax_grand_total(frm)
}
function calculate_tax_grand_total(frm) {
    let subtotal = 0;
    let tax_amount = 0;
    // Calculate subtotal first
    for (const item of frm.doc.items) {
        subtotal += item.quantity * item.unit_price;
    }
    // Calculate tax (18%)
    tax_amount = subtotal * 0.18;
    // Grand total is subtotal + tax
    let grand_total = subtotal
    if (frm.doc.tax) {
        grand_total += tax_amount;
    }

    // Set the values
    frm.set_value('tax_amount', tax_amount);
    frm.set_value('grand_total', grand_total);
    frm.set_value('amount', grand_total);

    // Refresh the form
    frm.refresh_field('tax_amount');
    frm.refresh_field('grand_total');
    frm.refresh_field('amount');
}

