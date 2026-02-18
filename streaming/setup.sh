cd /opt/streaming
echo "services:" > docker-compose.yml
echo "  mediamtx:" >> docker-compose.yml
echo "    image: bluenviron/mediamtx:latest" >> docker-compose.yml
echo "    container_name: mediamtx" >> docker-compose.yml
echo "    ports:" >> docker-compose.yml
echo '      - "1935:1935"' >> docker-compose.yml
echo '      - "8888:8888"' >> docker-compose.yml
echo '      - "8554:8554"' >> docker-compose.yml
echo "    volumes:" >> docker-compose.yml
echo "      - ./mediamtx.yml:/mediamtx.yml" >> docker-compose.yml
echo "    environment:" >> docker-compose.yml
echo '      - MTX_STREAM_KEY=${MTX_STREAM_KEY}' >> docker-compose.yml
echo "    restart: unless-stopped" >> docker-compose.yml
echo "rtmp: yes" > mediamtx.yml
echo "rtmpAddress: :1935" >> mediamtx.yml
echo "" >> mediamtx.yml
echo "hls: yes" >> mediamtx.yml
echo "hlsAddress: :8888" >> mediamtx.yml
echo "hlsSegmentCount: 3" >> mediamtx.yml
echo "hlsSegmentDuration: 1s" >> mediamtx.yml
echo "hlsPartDuration: 200ms" >> mediamtx.yml
echo "hlsAllowOrigin: '*'" >> mediamtx.yml
echo "" >> mediamtx.yml
echo "rtsp: yes" >> mediamtx.yml
echo "rtspAddress: :8554" >> mediamtx.yml
echo "" >> mediamtx.yml
echo "paths:" >> mediamtx.yml
echo "  live:" >> mediamtx.yml
echo "    publishUser: publisher" >> mediamtx.yml
echo '    publishPass: $MTX_STREAM_KEY' >> mediamtx.yml
echo "    readUser:" >> mediamtx.yml
echo "    readPass:" >> mediamtx.yml
