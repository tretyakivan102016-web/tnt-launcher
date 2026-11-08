package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.network.ClientPlayNetworkHandler;
import net.minecraft.network.packet.c2s.play.ChatMessageC2SPacket;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

@Mixin(ClientPlayNetworkHandler.class)
public abstract class ChatMessageMixin {
    @Shadow public abstract void sendPacket(net.minecraft.network.packet.Packet<?> packet);

    /** К каждому своему сообщению в чат дописываем невидимый маркер TnT. */
    @Inject(method = "sendChatMessage(Ljava/lang/String;)V", at = @At("HEAD"), cancellable = true)
    private void tnt$markMessage(String content, CallbackInfo ci) {
        if (!content.endsWith(TntBadgeClient.MARK)) {
            ci.cancel();
            sendPacket(new ChatMessageC2SPacket(content + TntBadgeClient.MARK));
        }
    }
}
