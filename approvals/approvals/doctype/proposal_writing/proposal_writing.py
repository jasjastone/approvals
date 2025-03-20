# Copyright (c) 2025, jasjastone and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class ProposalWriting(Document):
	def approve(self):
		self.show_alert("Ok")
