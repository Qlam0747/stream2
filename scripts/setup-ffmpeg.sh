#!/bin/bash

echo "Installing FFmpeg..."

# For Ubuntu/Debian
if [ -f /etc/debian_version ]; then
    sudo apt-get update
    sudo apt-get install -y ffmpeg
fi

# For CentOS/RHEL
if [ -f /etc/redhat-release ]; then
    sudo yum install -y epel-release
    sudo yum update -y
    sudo yum install -y ffmpeg ffmpeg-devel
fi

# For Alpine
if [ -f /etc/alpine-release ]; then
    sudo apk add --no-cache ffmpeg
fi

echo "FFmpeg installation complete"
ffmpeg -version