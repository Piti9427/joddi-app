import SwiftUI
import Supabase

struct AddTransactionView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var type: AppTransaction.TransactionType = .expense
    @State private var amountText = ""
    @State private var category = ""
    @State private var merchant = ""
    @State private var note = ""
    @State private var date = Date()
    @State private var isSaving = false
    @State private var errorMessage: String?

    private var supabase: SupabaseClient { SupabaseService.shared.client }

    private let expenseCategories = ["Food & Drink", "Transport", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"]
    private let incomeCategories = ["Salary", "Freelance", "Investment", "Gift", "Other"]

    private var categories: [String] {
        type == .expense ? expenseCategories : incomeCategories
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Type Toggle
                    Picker("Type", selection: $type) {
                        Text("Expense").tag(AppTransaction.TransactionType.expense)
                        Text("Income").tag(AppTransaction.TransactionType.income)
                    }
                    .pickerStyle(.segmented)
                    .padding(.horizontal)

                    // Amount
                    VStack(spacing: 8) {
                        Text(type == .expense ? "How much did you spend?" : "How much did you earn?")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)

                        HStack(alignment: .firstTextBaseline, spacing: 4) {
                            Text("$")
                                .font(.title.weight(.bold))
                                .foregroundStyle(.secondary)
                            TextField("0", text: $amountText)
                                .font(.system(size: 48, weight: .black, design: .rounded))
                                .keyboardType(.decimalPad)
                                .multilineTextAlignment(.center)
                                .frame(maxWidth: 200)
                        }
                        .frame(maxWidth: .infinity)
                    }
                    .padding(.vertical, 20)

                    // Category
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Category")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(categories, id: \.self) { cat in
                                    Button {
                                        category = cat
                                    } label: {
                                        Text(cat)
                                            .font(.caption.weight(.bold))
                                            .padding(.horizontal, 16)
                                            .padding(.vertical, 10)
                                            .background(
                                                category == cat
                                                    ? AnyShapeStyle(.green)
                                                    : AnyShapeStyle(Color(.tertiarySystemBackground)),
                                                in: Capsule()
                                            )
                                            .foregroundStyle(category == cat ? .white : .primary)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }

                    // Merchant & Note
                    VStack(spacing: 12) {
                        HStack {
                            Image(systemName: "storefront.fill")
                                .foregroundStyle(.secondary)
                            TextField("Merchant (optional)", text: $merchant)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))

                        HStack {
                            Image(systemName: "note.text")
                                .foregroundStyle(.secondary)
                            TextField("Note (optional)", text: $note)
                        }
                        .padding()
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))

                        DatePicker("Date", selection: $date, displayedComponents: .date)
                            .padding()
                            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal)

                    if let error = errorMessage {
                        Text(error)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.red)
                    }

                    // Save Button
                    Button {
                        Task { await saveTransaction() }
                    } label: {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Save Transaction")
                                .font(.headline.weight(.bold))
                        }
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(.green.gradient, in: RoundedRectangle(cornerRadius: 16))
                    }
                    .disabled(isSaving)
                    .padding(.horizontal)

                    Spacer()
                }
                .padding(.top, 8)
            }
            .navigationTitle("Add Transaction")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
    }

    private func saveTransaction() async {
        guard let amount = Decimal(string: amountText), amount > 0 else {
            errorMessage = "กรุณากรอกจำนวนเงิน"
            return
        }
        guard !category.isEmpty else {
            errorMessage = "กรุณาเลือกหมวดหมู่"
            return
        }

        isSaving = true
        errorMessage = nil

        struct NewTransaction: Encodable {
            let type: String
            let amount: Decimal
            let category: String
            let note: String?
            let merchant: String?
            let date: Date
        }

        do {
            try await supabase
                .from("transactions")
                .insert(NewTransaction(
                    type: type.rawValue,
                    amount: amount,
                    category: category,
                    note: note.isEmpty ? nil : note,
                    merchant: merchant.isEmpty ? nil : merchant,
                    date: date
                ))
                .execute()

            dismiss()
        } catch {
            errorMessage = "บันทึกไม่สำเร็จ: \(error.localizedDescription)"
            isSaving = false
        }
    }
}
