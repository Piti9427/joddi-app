import Foundation

struct AppBudget: Identifiable, Codable, Hashable {
    let id: UUID
    var categoryId: UUID?
    var amountLimit: Decimal
    var monthYear: Date
    var userId: UUID?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case categoryId = "category_id"
        case amountLimit = "amount_limit"
        case monthYear = "month_year"
        case userId = "user_id"
        case createdAt = "created_at"
    }
}
