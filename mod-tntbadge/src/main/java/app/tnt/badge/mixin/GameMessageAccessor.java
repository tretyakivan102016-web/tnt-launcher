package app.tnt.badge.mixin;

import net.minecraft.network.packet.s2c.play.GameMessageS2CPacket;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Final;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;

@Mixin(GameMessageS2CPacket.class)
public interface GameMessageAccessor {
    @Shadow @Final Text tnt$message();
}
