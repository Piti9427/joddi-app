import Foundation

struct AppCategory: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var type: String               // "Income" or "Expense"
    var color: String?
    var icon: String?
    var userId: UUID?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, name, type, color, icon
        case userId = "user_id"
        case createdAt = "created_at"
    }

    var isExpense: Bool { type == "Expense" }
}
