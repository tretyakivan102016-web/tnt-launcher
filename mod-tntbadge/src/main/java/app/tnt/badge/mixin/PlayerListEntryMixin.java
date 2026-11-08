package app.tnt.badge.mixin;

import app.tnt.badge.TntBadgeClient;
import com.mojang.authlib.GameProfile;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.hud.PlayerListEntry;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(PlayerListEntry.class)
public abstract class PlayerListEntryMixin {
    @Shadow public abstract GameProfile getProfile();

    /** Таблица игроков (Tab): 🧨 перед никами TnT-игроков (свой ник — всегда). */
    @Inject(method = "getDisplayName", at = @At("RETURN"), cancellable = true)
    private void tnt$badgeTab(CallbackInfoReturnable<Text> cir) {
        try {
            if (cir.getReturnValue() == null) return;
            String name = getProfile() != null ? getProfile().getName() : null;
            if (name == null) return;
            String self = MinecraftClient.getInstance().player != null
                    ? MinecraftClient.getInstance().player.getGameProfile().getName() : null;
            if (name.equals(self) || TntBadgeClient.isTnt(name)) {
                TntBadgeClient.rememberTnt(name);
                cir.setReturnValue(Text.literal(TntBadgeClient.GLYPH + " ").append(cir.getReturnValue()));
            }
        } catch (Throwable ignored) {}
    }
}
