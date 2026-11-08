package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import net.minecraft.client.gui.hud.ChatHud;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Mixin(ChatHud.class)
public abstract class ChatHudMixin {
    private static final Pattern VANILLA_CHAT = Pattern.compile("^<([^>]{1,16})>\s?(.*)$", Pattern.DOTALL);

    /** Любая строка чата: вырезаем маркер TnT, запоминаем автора и рисуем 🧨 перед ником. */
    @Inject(method = "addMessage(Lnet/minecraft/text/Text;)V", at = @At("HEAD"), cancellable = true)
    private void tnt$badgeChatLine(Text message, CallbackInfo ci) {
        try {
            String raw = message.getString();
            if (!raw.contains(TntBadgeClient.MARK)) return;
            String clean = raw.replace(TntBadgeClient.MARK, "");
            Matcher m = VANILLA_CHAT.matcher(clean);
            if (m.find()) {
                String author = m.group(1);
                TntBadgeClient.rememberTnt(author);
                clean = TntBadgeClient.GLYPH + author + " » " + m.group(2);
            }
            ci.cancel();
            ((ChatHud) (Object) this).addMessage(Text.literal(clean));
        } catch (Throwable ignored) {}
    }
}
