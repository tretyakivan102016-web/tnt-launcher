package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import net.minecraft.client.network.ClientPlayNetworkHandler;
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

    /** Входящее сообщение: вырезаем маркер, запоминаем TnT-автора и рисуем 🧨 перед ником. */
    @Inject(method = "onChatMessage(Lnet/minecraft/text/Text;Z)V", at = @At("HEAD"), cancellable = true)
    private void tnt$badgeIncoming(Text message, boolean overlay, CallbackInfo ci) {
        String raw = message.getString();
        if (!raw.contains(TntBadgeClient.MARK)) return;
        String clean = raw.replace(TntBadgeClient.MARK, "");
        Matcher m = VANILLA_CHAT.matcher(clean);
        if (m.find()) {
            String author = m.group(1);
            TntBadgeClient.rememberTnt(author);
            clean = TntBadgeClient.GLYPH + author + " " + "» " + m.group(2);
        }
        if (overlay) return;                       // системные оверлеи не трогаем
        ci.cancel();
        ((ClientPlayNetworkHandler) (Object) this).onChatMessage(Text.literal(clean).styled(message.getStyle()), false);
    }
}
