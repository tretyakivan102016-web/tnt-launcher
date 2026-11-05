package app.tnt.launcher;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
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
 * последний релиз через API сайта (/api/release), чтобы версия была видна сразу.
 */
public class MainActivity extends Activity {

    private static final String SITE = "https://tntlauncher.app";

    private WebView web;

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

        checkRelease();
    }

    /** Спрашивает у API сайта последнюю версию релиза и показывает её в шапке. */
    private void checkRelease() {
        final TextView ver = findViewById(R.id.version);
        new Thread(() -> {
            String result;
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(SITE + "/api/release").openConnection();
                c.setConnectTimeout(8000);
                c.setReadTimeout(8000);
                c.setRequestProperty("User-Agent", "TnTLauncherAndroid/1.6.0");
                BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = r.readLine()) != null) sb.append(line);
                r.close();
                JSONObject j = new JSONObject(sb.toString());
                result = j.optBoolean("available")
                        ? getString(R.string.version_prefix) + " " + j.optString("version", "")
                        : getString(R.string.version_soon);
            } catch (Exception e) {
                result = getString(R.string.version_offline);
            }
            final String text = result;
            runOnUiThread(() -> ver.setText(text));
        }).start();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
