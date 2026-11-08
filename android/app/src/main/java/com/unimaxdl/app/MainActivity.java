package com.unimaxdl.app;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.URLUtil;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private static final String DEFAULT_URL = "https://unimaxdl.github.io/";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        configureWebView();
        handleIncomingIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIncomingIntent(intent);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportMultipleWindows(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " UnimaxDL-Android/1.0");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("https://unimaxdl.github.io") || url.startsWith("http://localhost")) {
                    return false;
                }
                // External links (including Monetag ads) open in system browser
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                startActivity(intent);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, android.os.Message resultMsg) {
                WebView.HitTestResult result = view.getHitTestResult();
                String data = result.getExtra();
                if (data != null) {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(data));
                    startActivity(intent);
                    return true;
                }
                return super.onCreateWindow(view, isDialog, isUserGesture, resultMsg);
            }
        });

        // Native Android DownloadManager integration
        webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
            try {
                DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                request.setMimeType(mimetype);
                request.addRequestHeader("User-Agent", userAgent);
                request.setDescription("Downloading media via UnimaxDL...");
                
                String filename = URLUtil.guessFileName(url, contentDisposition, mimetype);
                request.setTitle(filename);
                request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "UnimaxDL/" + filename);

                DownloadManager dm = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (dm != null) {
                    dm.enqueue(request);
                    Toast.makeText(MainActivity.this, "Download started: " + filename, Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                Toast.makeText(MainActivity.this, "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void handleIncomingIntent(Intent intent) {
        if (intent == null) {
            webView.loadUrl(DEFAULT_URL);
            return;
        }

        String action = intent.getAction();
        String type = intent.getType();

        // Catch Shared URLs from YouTube, TikTok, Instagram, Twitter
        if (Intent.ACTION_SEND.equals(action) && type != null && "text/plain".equals(type)) {
            String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
            if (sharedText != null && !sharedText.trim().isEmpty()) {
                String cleanUrl = extractUrl(sharedText);
                try {
                    String target = DEFAULT_URL + "?url=" + URLEncoder.encode(cleanUrl, StandardCharsets.UTF_8.toString());
                    webView.loadUrl(target);
                    Toast.makeText(this, "Analyzing shared media...", Toast.LENGTH_SHORT).show();
                    return;
                } catch (Exception ignored) {}
            }
        }

        // Deep Link Handling: unimaxdl://download?url=... or unimaxdl://open?url=...
        if (Intent.ACTION_VIEW.equals(action) && intent.getData() != null) {
            Uri data = intent.getData();
            if ("unimaxdl".equalsIgnoreCase(data.getScheme())) {
                String targetUrl = data.getQueryParameter("url");
                if (targetUrl == null || targetUrl.trim().isEmpty()) {
                    targetUrl = data.getSchemeSpecificPart();
                    if (targetUrl != null && targetUrl.startsWith("//")) {
                        targetUrl = targetUrl.substring(2);
                    }
                }
                if (targetUrl != null && !targetUrl.trim().isEmpty()) {
                    String cleanUrl = extractUrl(targetUrl);
                    try {
                        String target = DEFAULT_URL + "?url=" + URLEncoder.encode(cleanUrl, StandardCharsets.UTF_8.toString());
                        webView.loadUrl(target);
                        Toast.makeText(this, "Opening in UnimaxDL 4K App...", Toast.LENGTH_SHORT).show();
                        return;
                    } catch (Exception ignored) {}
                }
            }
        }

        webView.loadUrl(DEFAULT_URL);
    }

    private String extractUrl(String text) {
        for (String word : text.split("\\s+")) {
            if (word.startsWith("http://") || word.startsWith("https://")) {
                return word;
            }
        }
        return text.trim();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
