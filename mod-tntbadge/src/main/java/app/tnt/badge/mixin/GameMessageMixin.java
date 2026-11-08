package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import net.minecraft.client.network.ClientPlayNetworkHandler;
import net.minecraft.network.packet.s2c.play.GameMessageS2CPacket;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Mixin(ClientPlayNetworkHandler.class)
public abstract class GameMessageMixin {
    private static final Pattern VANILLA_CHAT = Pattern.compile("^<([^>]{1,16})>\s?(.*)$", Pattern.DOTALL);

    /** Системные/чатовые сообщения: вырезаем маркер, запоминаем TnT-автора, рисуем 🧨 перед ником. */
    @Inject(method = "onGameMessage(Lnet/minecraft/network/packet/s2c/play/GameMessageS2CPacket;)V", at = @At("HEAD"), cancellable = true)
    private void tnt$badgeIncoming(GameMessageS2CPacket packet, CallbackInfo ci) {
        try {
            Text msg = ((app.tnt.badge.mixin.GameMessageAccessor) (Object) packet).tnt$message();
            String raw = msg.getString();
            if (!raw.contains(TntBadgeClient.MARK)) return;
            String clean = raw.replace(TntBadgeClient.MARK, "");
            Matcher m = VANILLA_CHAT.matcher(clean);
            if (m.find()) {
                String author = m.group(1);
                TntBadgeClient.rememberTnt(author);
                clean = TntBadgeClient.GLYPH + author + " » " + m.group(2);
            }
            ci.cancel();
            ((ClientPlayNetworkHandler) (Object) this).onGameMessage(new GameMessageS2CPacket(Text.literal(clean), false));
        } catch (Throwable ignored) {}
    }
}
