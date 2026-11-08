package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import net.minecraft.network.packet.c2s.play.ChatMessageC2SPacket;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Mutable;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ChatMessageC2SPacket.class)
public abstract class ChatMessageMixin {
    @Shadow @Final @Mutable private String chatMessage;

    /** К своему сообщению в чат дописываем невидимый маркер TnT (U+200D). */
    @Inject(method = "<init>", at = @At("RETURN"))
    private void tnt$markMessage(String chatMessage, CallbackInfo ci) {
        if (!this.chatMessage.endsWith(TntBadgeClient.MARK)) this.chatMessage = this.chatMessage + TntBadgeClient.MARK;
    }
}
