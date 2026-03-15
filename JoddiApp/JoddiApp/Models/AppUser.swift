import Foundation

struct AppUser: Identifiable, Codable {
    let id: UUID
    var email: String?
    var displayName: String?
    var avatarUrl: String?
    var createdAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, email
        case displayName = "display_name"
        case avatarUrl = "avatar_url"
        case createdAt = "created_at"
    }
}
