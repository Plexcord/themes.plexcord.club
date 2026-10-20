#=========================================================================#
# HestiaCP proxy template: themes.plexcord.club (HTTP)                    #
# Everything goes to Next.js on 127.0.0.1:8254. Nginx serves no files     #
# from disk, so nothing in public_html (.env, source) is ever exposed.    #
#=========================================================================#

server {
	listen      %ip%:%proxy_port%;
	server_name %domain_idn% %alias_idn%;
	error_log   /var/log/%web_system%/domains/%domain%.error.log error;

	include %home%/%user%/conf/web/%domain%/nginx.forcessl.conf*;

	client_max_body_size 12m;

	location ~ /\.(?!well-known\/) {
		deny all;
		return 404;
	}

	location / {
		proxy_pass         http://127.0.0.1:8254;
		proxy_http_version 1.1;
		proxy_set_header   Host $host;
		proxy_set_header   X-Real-IP $remote_addr;
		proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header   X-Forwarded-Proto $scheme;
	}

	include %home%/%user%/conf/web/%domain%/nginx.conf_*;
}
