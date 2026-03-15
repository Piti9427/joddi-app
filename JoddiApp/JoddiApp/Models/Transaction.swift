import Foundation

struct AppTransaction: Identifiable, Codable, Hashable {
    let id: UUID
    var type: TransactionType
    var amount: Decimal
    var category: String?
    var note: String?
    var merchant: String?
    var date: Date
    var userId: UUID?
    var categoryId: UUID?

    enum TransactionType: String, Codable, CaseIterable {
        case income = "Income"
        case expense = "Expense"
    }

    enum CodingKeys: String, CodingKey {
        case id, type, amount, category, note, merchant, date
        case userId = "user_id"
        case categoryId = "category_id"
    }

    var isExpense: Bool { type == .expense }
    var displayAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: amount as NSDecimalNumber) ?? "$0"
    }
}
