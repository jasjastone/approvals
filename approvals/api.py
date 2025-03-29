import frappe
from frappe.model.mapper import get_mapped_doc
from frappe import _


@frappe.whitelist()
def approve(doc):
    doc = frappe.get_doc("Proposal Writing", doc)
    if doc.docstatus != 1:
        frappe.msgprint(
            _("Proposal must be submitted before approval"),
            alert=True,
            indicator="Red",
        )
        return
    if doc.custom_status == "Rejected" or doc.custom_status == "Approved":
        frappe.msgprint(
            _("No Action Needed"),
            alert=True,
            indicator="Yellow",
        )
        return
    try:
        for approver in doc.approvers:
            if approver.approver == frappe.session.user:
                approver.status = "Approved"
                doc.save()
                frappe.db.commit()
                frappe.msgprint(
                    _("Approved "),
                    alert=True,
                    indicator="Green",
                )
            else:
                frappe.msgprint(
                    _(
                        "Your not allowed to approve, if you think this is a mistake send email to it for further assistance"
                    ),
                    alert=True,
                    indicator="Red",
                )

        # Update the status field
        approved = 0
        rejected = 0
        for approver in doc.approvers:
            if approver.status == "Approved":
                approved += 1
            if approver.status == "Rejected":
                rejected += 1

        if approved == doc.approvers.length:
            doc.custom_status = "Approved"
            doc.save()
            frappe.db.commit()
        if rejected == doc.approvers.length:
            doc.custom_status = "Rejected"
            doc.save()
            frappe.db.commit()

    except Exception as _e:
        frappe.msgprint(
            _("Fail to Approve try again {0}").format(_e),
            alert=True,
            indicator="Red",
        )


@frappe.whitelist()
def reject(doc):
    doc = frappe.get_doc("Proposal Writing", doc)
    if doc.docstatus != 1:
        return _("Proposal must be submitted before approval")
    if (
        doc.custom_status != "Rejected"
        and doc.custom_status != "Draft"
        and doc.custom_status != "Approved"
    ):
        doc.custom_status = "Rejected"
        doc.save()
        frappe.db.commit()
        return _("Rejected Successfull")


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
                    "docstatus": [
                        "=",
                        1,
                    ]  # Only allow conversion if proposal is submitted
                },
            },
            "Proposal Item": {  # This should match your child table doctype name
                "doctype": "Purchase Order Item",
                "field_map": {
                    "item_code": "item_code",
                    "item_name": "item_name",
                    "description": "description",
                    "qty": "qty",
                    "rate": "rate",
                    "uom": "stock_uom",
                    # Map other fields as needed
                },
                "postprocess": update_item,
            },
        },
        target_doc,
    )

    return doc
