from operator import indexOf
import frappe
from frappe.model.mapper import get_mapped_doc
from frappe import _


@frappe.whitelist()
def approve_reject(doc, action):
    doc = frappe.get_doc("Proposal Writing", doc)
    if doc.docstatus != 1:
        frappe.msgprint(
            _("Proposal must be submitted before approval"),
            alert=True,
            indicator="Red",
        )
        return
    if doc.status == "Rejected" or doc.status == "Approved":
        frappe.msgprint(
            _("No Action Needed"),
            alert=True,
            indicator="Yellow",
        )
        return
    try:
        for approver in doc.approvers:
            if approver.approver == frappe.session.user and approver.status == "New":
                i = doc.approvers.index(approver)
                for _ in doc.approvers:
                    j = doc.approvers.index(_)
                    if _.status == "New" and i > j:
                        frappe.msgprint(
                            _(
                                "Please wait for "
                                + _.approver
                                + " To complete his approval process"
                            ),
                            alert=True,
                            indicator="Red",
                        )
                        return
                if action == "1":
                    approver.status = "Approved"
                    doc.save()
                else:
                    approver.status = "Rejected"
                    doc.save()
                frappe.db.commit()
                frappe.msgprint(
                    _("Approved" if action == "1" else "Rejected"),
                    alert=True,
                    indicator="Green",
                )
            else:
                frappe.msgprint(
                    _(
                        "Your not allowed to perform this action, if you think this is a mistake send email to IT for further assistance"
                    ),
                    alert=True,
                    indicator="Red",
                )
                return

        # Update the status field
        approved = 0
        rejected = 0
        for approver in doc.approvers:
            if approver.status == "Approved":
                approved += 1
            if approver.status == "Rejected":
                rejected += 1
        # if all of the people approve
        if approved == len(doc.approvers):
            doc.status = "Approved"
            doc.save()
            frappe.db.commit()
        # if any one reject set status to rejected
        if rejected > 0:
            doc.status = "Rejected"
            doc.save()
            frappe.db.commit()
        # Send email to the proposal writer
    except Exception as _e:
        _approve_reject = "Approve" if action == "1" else "Reject"
        frappe.msgprint(
            _("Fail to {0} try again {1}").format(_approve_reject, _e),
            alert=True,
            indicator="Red",
        )


@frappe.whitelist()
def convert_to_po(source_name, target_doc=None):
    def update_item(obj, target, source_parent):
        pass

    doc = get_mapped_doc(
        "Proposal Writing",
        source_name,
        {
            "Proposal Writing": {
                "doctype": "Purchase Order",
                "field_map": {
                    "name": "proposal_reference",
                    # Map any other fields from proposal to purchase order
                },
                "validation": {
                    "status": [
                        "=",
                        "Approved",
                    ]  # Only allow conversion if proposal is approved
                },
            },
            "Purchase Order Item": {  # This should match your child table doctype name
                "doctype": "Purchase Order Item",
                "field_map": {
                    "item_code": "item_code",
                    "item_name": "item_name",
                    "quantity": "qty",
                    "unit_price": "rate",
                    "uom": "stock_uom",
                    "date_to": "schedule_date",
                    # Map other fields as needed
                },
                "postprocess": update_item,
            },
        },
        target_doc,
    )

    return doc
