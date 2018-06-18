<?php

include get_template_directory() . '/config/load.php';

if ( ! class_exists( 'Pokedex' )) {
    
    /**
    * 
    */
    class Pokedex {
        
        function __construct() {
           // Theme setup
      		$this->theme_setup();
            // Adding actions
            $this->add_actions();
            $this->add_filters();
        }

        public function theme_setup() {
            global $kili_framework;
            $kili_framework->render_pages();
            
            register_nav_menus(array(
                'main_navigation' => __( 'Main Navigation', 'pokedex' ),
            ));
            
            add_theme_support( 'post-thumbnails' );
            $kili_framework->render_pages();
        }

        public function add_actions() {
            if (!is_admin()) {
				add_action( 'wp_enqueue_scripts', array($this, 'load_assets') );
            }
            
            // limit categories wordpress ----------------
            if (is_admin()) {
                add_action( 'admin_head', 'admin_inline_js' );
                function admin_inline_js(){
                    echo "<script type='text/javascript'>\n";
                    echo 'jQuery(document).ready(function($){
                        $("#typeschecklist input:checkbox").change(function () {
                            var max = 2;
                            var count = $("#typeschecklist input:checked").length;
                            if (count > max) {
                                $(this).prop("checked", "");
                                alert("You can choose " + max + " categor" + (max==2?"y":"ies") );
                            }
                        });
                    });';
                    echo "\n</script>";
                }
            }
        }

        public function add_filters() {
            add_filter( 'timber_context', array( $this, 'theme_context' ) );
        }

        public function theme_context($context) {
            global $kili_framework;

            $context['page'] = new TimberPost();
            $context['theme_mods'] = get_theme_mods();
            $context['menu'] = array(
            'primary' => new TimberMenu( 'primary_navigation' )
            );
            $context['pokemons'] = get_posts( array( 
                'post_type' => 'pokemon',
                'orderby' => array( 'date' => 'ASC' ),
                'numberposts' => get_option( 'posts_per_page' ),
            ));
        
            return $context;
        }

        public function load_assets() {
            global $kili_framework;
            wp_enqueue_style( 'theme-style', $kili_framework->asset_path( 'styles/main.css' ), false, null );
            // wp_enqueue_style( 'theme-style-overwrite', $kili_framework->asset_path( 'styles/block-styles.css'), array( 'theme-style' ) );
            wp_enqueue_script( 'theme-scripts', $kili_framework->asset_path('scripts/main.js'), ['jquery'], null, true );
        }

        public function theme_translations() {

        }
    }
}

$pokedex = new Pokedex();