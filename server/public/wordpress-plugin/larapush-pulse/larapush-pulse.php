<?php
/**
 * Plugin Name: LaraPush Pulse - Web Push Notifications
 * Plugin URI: https://larapush.com
 * Description: High-performance, self-hosted web push notifications with 10M+ users scalability, FCM Topics engine, Floating Bell, and automatic Push-on-Publish.
 * Version: 2.5.0
 * Author: LaraPush Pulse Engine
 * Author URI: https://larapush.com
 * License: GPLv2 or later
 * Text Domain: larapush-pulse
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LARAPUSH_VERSION', '2.5.0');
define('LARAPUSH_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LARAPUSH_PLUGIN_URL', plugin_dir_url(__FILE__));

// Register admin settings menu
add_action('admin_menu', 'larapush_add_admin_menu');
function larapush_add_admin_menu() {
    add_menu_page(
        'LaraPush Pulse',
        'LaraPush Pulse',
        'manage_options',
        'larapush-pulse',
        'larapush_settings_page',
        'dashicons-bell',
        85
    );
}

// Register settings
add_action('admin_init', 'larapush_register_settings');
function larapush_register_settings() {
    register_setting('larapush_settings_group', 'larapush_server_url');
    register_setting('larapush_settings_group', 'larapush_project_id');
    register_setting('larapush_settings_group', 'larapush_push_on_publish');
    register_setting('larapush_settings_group', 'larapush_utm_tracking');
}

// Admin settings page HTML
function larapush_settings_page() {
    $server_url = get_option('larapush_server_url', 'http://localhost:5000');
    $project_id = get_option('larapush_project_id', 'main-website');
    $push_on_publish = get_option('larapush_push_on_publish', '1');
    $utm_tracking = get_option('larapush_utm_tracking', '1');
    ?>
    <div class="wrap" style="max-width: 850px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: #fff; padding: 24px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
            <h1 style="color: #fff; margin: 0 0 8px 0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
                <span style="background: #4f46e5; padding: 6px 10px; border-radius: 8px;">🔔</span> LaraPush Pulse - Web Push Engine
            </h1>
            <p style="margin: 0; opacity: 0.85; font-size: 14px;">Enterprise-grade Web Push Notifications with FCM Topics (10M+ Scalability, Zero monthly fees).</p>
        </div>

        <form method="post" action="options.php" style="background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <?php settings_fields('larapush_settings_group'); ?>
            <?php do_settings_sections('larapush_settings_group'); ?>

            <table class="form-table" style="margin-top: 0;">
                <tr>
                    <th scope="row"><label for="larapush_server_url"><strong>LaraPush Server URL</strong></label></th>
                    <td>
                        <input type="url" id="larapush_server_url" name="larapush_server_url" value="<?php echo esc_attr($server_url); ?>" class="regular-text" placeholder="https://push.yourdomain.com" required style="width: 100%; max-width: 450px;" />
                        <p class="description">The URL where your LaraPush Pulse server dashboard is running (e.g. <code>https://push.yourdomain.com</code> or <code>http://localhost:5000</code>).</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><label for="larapush_project_id"><strong>Project / Website ID</strong></label></th>
                    <td>
                        <input type="text" id="larapush_project_id" name="larapush_project_id" value="<?php echo esc_attr($project_id); ?>" class="regular-text" placeholder="main-website" required style="width: 100%; max-width: 450px;" />
                        <p class="description">Your website's unique Project ID configured in the LaraPush dashboard (e.g. <code>main-website</code>).</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><strong>Auto Push on Publish</strong></th>
                    <td>
                        <label>
                            <input type="checkbox" name="larapush_push_on_publish" value="1" <?php checked($push_on_publish, '1'); ?> />
                            <strong>Automatically send push notification when a new post is published</strong>
                        </label>
                        <p class="description">Broadcasts the post title, excerpt, and featured image instantly to your subscribers.</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row"><strong>Google Analytics UTM</strong></th>
                    <td>
                        <label>
                            <input type="checkbox" name="larapush_utm_tracking" value="1" <?php checked($utm_tracking, '1'); ?> />
                            Append UTM tracking tags (<code>utm_source=larapush&utm_medium=push</code>)
                        </label>
                    </td>
                </tr>
            </table>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

            <div style="display: flex; align-items: center; justify-content: space-between;">
                <?php submit_button('Save Settings', 'primary', 'submit', false, ['style' => 'background: #4f46e5; border-color: #4f46e5; padding: 6px 20px; font-size: 14px;']); ?>
                <a href="<?php echo esc_attr($server_url); ?>" target="_blank" class="button" style="display: flex; align-items: center; gap: 6px;">
                    Open LaraPush Dashboard &rarr;
                </a>
            </div>
        </form>
    </div>
    <?php
}

// Enqueue Client SDK on frontend
add_action('wp_head', 'larapush_enqueue_sdk', 10);
function larapush_enqueue_sdk() {
    $server_url = rtrim(get_option('larapush_server_url', ''), '/');
    $project_id = get_option('larapush_project_id', 'main-website');

    if (empty($server_url)) return;

    ?>
    <!-- LaraPush Pulse Web Push Notification SDK -->
    <script src="<?php echo esc_url($server_url); ?>/push-sdk.js" async></script>
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        if (window.PushSDK) {
          PushSDK.init({
            apiUrl: '<?php echo esc_js($server_url); ?>',
            projectId: '<?php echo esc_js($project_id); ?>',
            autoPrompt: true
          });
        }
      });
    </script>
    <!-- /LaraPush Pulse SDK -->
    <?php
}

// Hook: Push on Publish (Auto-broadcast when article goes live)
add_action('publish_post', 'larapush_handle_post_publish', 10, 2);
function larapush_handle_post_publish($ID, $post) {
    $push_on_publish = get_option('larapush_push_on_publish', '1');
    if ($push_on_publish !== '1') return;

    // Check if already pushed for this post to avoid duplicates on revisions
    if (get_post_meta($ID, '_larapush_sent', true)) {
        return;
    }

    $server_url = rtrim(get_option('larapush_server_url', ''), '/');
    $project_id = get_option('larapush_project_id', 'main-website');
    $utm = get_option('larapush_utm_tracking', '1') === '1';

    if (empty($server_url)) return;

    $title = get_the_title($post);
    $excerpt = wp_strip_all_tags(get_the_excerpt($post));
    if (empty($excerpt)) {
        $excerpt = wp_strip_all_tags(wp_trim_words($post->post_content, 25, '...'));
    }

    $permalink = get_permalink($ID);
    if ($utm) {
        $permalink = add_query_arg([
            'utm_source' => 'larapush',
            'utm_medium' => 'push_notification',
            'utm_campaign' => sanitize_title($title)
        ], $permalink);
    }

    // Featured image
    $image_url = '';
    if (has_post_thumbnail($ID)) {
        $img = wp_get_attachment_image_src(get_post_thumbnail_id($ID), 'large');
        if ($img) $image_url = $img[0];
    }

    $payload = [
        'projectId' => $project_id,
        'title' => $title,
        'body' => $excerpt,
        'imageUrl' => $image_url,
        'clickUrl' => $permalink,
        'notificationType' => 'article',
        'source' => 'wordpress_push_on_publish'
    ];

    // Fire non-blocking HTTP request to server
    wp_remote_post($server_url . '/api/send', [
        'method' => 'POST',
        'headers' => ['Content-Type' => 'application/json'],
        'body' => wp_json_encode($payload),
        'timeout' => 5,
        'blocking' => false
    ]);

    // Mark as sent
    update_post_meta($ID, '_larapush_sent', time());
}
