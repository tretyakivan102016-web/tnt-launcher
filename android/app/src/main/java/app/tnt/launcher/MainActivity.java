package app.tnt.launcher;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * TnT Launcher для Android.
 * Показывает сайт лаунчера (скачивание, аккаунт, форум, поддержка) и проверяет
 * последний релиз через API сайта (/api/release). Если вышла новая версия —
 * показывает баннер и открывает страницу приложения в Google Play.
 */
public class MainActivity extends Activity {

    private static final String SITE = "https://tntlauncher.app";

    private WebView web;
    private LinearLayout updBar;
    private String latestVersion = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        web = findViewById(R.id.web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        web.setWebViewClient(new WebViewClient());
        web.loadUrl(SITE);

        updBar = findViewById(R.id.updBar);
        findViewById(R.id.updBtn).setOnClickListener(v -> openPlayStore());

        checkRelease();
    }

    /** Спрашивает у API сайта последнюю версию и при обновлении показывает баннер с переходом в Google Play. */
    private void checkRelease() {
        final TextView ver = findViewById(R.id.version);
        new Thread(() -> {
            String statusText;
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(SITE + "/api/release").openConnection();
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                c.setRequestProperty("User-Agent", "TnTLauncherAndroid/" + currentVersion());
                BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
                r.close();
                JSONObject j = new JSONObject(sb.toString());
                if (j.optBoolean("available")) {
                    latestVersion = j.optString("version", "");
                    statusText = getString(R.string.version_prefix) + " " + latestVersion;
                    runOnUiThread(() -> maybeShowUpdate());
                } else {
                    statusText = getString(R.string.version_soon);
                }
            } catch (Exception e) {
                statusText = getString(R.string.version_offline);
            }
            final String text = statusText;
            runOnUiThread(() -> ver.setText(text));
        }).start();
    }

    /** Если версия на сайте новее нашей — баннер «Обновить» (ведёт в Google Play); один раз сами открываем страницу. */
    private void maybeShowUpdate() {
        if (latestVersion == null || !isNewer(latestVersion, currentVersion())) return;
        ((TextView) findViewById(R.id.updText)).setText(getString(R.string.upd_available, latestVersion));
        updBar.setVisibility(View.VISIBLE);
        SharedPreferences prefs = getPreferences(MODE_PRIVATE);
        if (!prefs.getBoolean("prompted_" + latestVersion, false)) {   // автоматически перекидываем в Play один раз на версию
            prefs.edit().putBoolean("prompted_" + latestVersion, true).apply();
            openPlayStore();
        }
    }

    private void openPlayStore() {
        Uri market = Uri.parse("market://details?id=" + getPackageName());
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, market));
        } catch (Exception e) {                                  // Play Store не установлен — открываем веб-страницу
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + getPackageName())));
            } catch (Exception ignored) {
                Toast.makeText(this, R.string.upd_open_failed, Toast.LENGTH_SHORT).show();
            }
        }
    }

    private String currentVersion() {
        try { return getPackageManager().getPackageInfo(getPackageName(), 0).versionName; }
        catch (Exception e) { return "0.0.0"; }
    }

    /** Сравнение версий вида 1.6.2: больше/меньше по числам, игнорируя суффиксы. */
    static boolean isNewer(String latest, String current) {
        try {
            String[] a = latest.replaceAll("[^0-9.].*$", "").split("\\."),
                   b = current.replaceAll("[^0-9.].*$", "").split("\\.");
            for (int i = 0; i < Math.max(a.length, b.length); i++) {
                int x = i < a.length ? Integer.parseInt(a[i]) : 0;
                int y = i < b.length ? Integer.parseInt(b[i]) : 0;
                if (x != y) return x > y;
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
