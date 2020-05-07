package zone.disco.shoebox.messages

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.annotation.JsonTypeName
import zone.disco.shoebox.models.Position
import zone.disco.shoebox.models.RoomMeta
import zone.disco.shoebox.models.User

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
sealed class ClientMessage {
    @JsonTypeName("chat")
    data class Chat(val message: String): ClientMessage()

    @JsonTypeName("move")
    data class Move(val x: Int, val y: Int): ClientMessage()
}

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
sealed class ServerMessage {
    @JsonTypeName("joined")
    data class Joined(val userId: String, val user: User, val position: Position): ServerMessage()

    @JsonTypeName("left")
    data class Left(val userId: String): ServerMessage()

    @JsonTypeName("sync")
    data class Sync(
        val room: RoomMeta,
        val positions: Map<String, Position>,
        val users: Map<String, User>
    ): ServerMessage()

    @JsonTypeName("chat")
    data class Chat(val userId: String, val message: String): ServerMessage()

    @JsonTypeName("move")
    data class Move(val userId: String, val position: Position): ServerMessage()

    @JsonTypeName("identity")
    data class Identity(val userId: String): ServerMessage()

    @JsonTypeName("error")
    data class Error(val message: String): ServerMessage()
}
