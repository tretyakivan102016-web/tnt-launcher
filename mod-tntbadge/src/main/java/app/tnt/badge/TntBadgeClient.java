package app.tnt.badge;

import net.fabricmc.api.ClientModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public class TntBadgeClient implements ClientModInitializer {
    public static final Logger LOG = LoggerFactory.getLogger("tntbadge");
    public static final String MARK = "\u200D";    // невидимый маркер «этот игрок с TnT»
    public static final String GLYPH = "\uE001";   // глиф динамита из нашего шрифта
    public static final Set<String> TNT_PLAYERS = ConcurrentHashMap.newKeySet();

    @Override
    public void onInitializeClient() {
        LOG.info("TnT Badge: динамит 🧨 активен (чат и список игроков)");
    }

    public static boolean isTnt(String name) {
        return name != null && TNT_PLAYERS.contains(name.toLowerCase());
    }

    public static void rememberTnt(String name) {
        if (name != null && !name.isBlank()) TNT_PLAYERS.add(name.toLowerCase());
    }
}
