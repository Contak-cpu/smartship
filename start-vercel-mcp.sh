#!/bin/bash

# Vercel MCP Auto-Start Script
# This script ensures Vercel MCP connection is always available

echo "🚀 Starting Vercel MCP Connection..."

# Set environment variables
export VERCEL_TOKEN="k72PAk8f1VJms6qowWugrLrk"
export VERCEL_MCP_URL="https://mcp.vercel.com"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if the MCP script exists
if [ ! -f "mcp-vercel.js" ]; then
    echo "❌ mcp-vercel.js not found"
    exit 1
fi

# Test the connection first
echo "🔍 Testing Vercel connection..."
node mcp-vercel.js test

if [ $? -eq 0 ]; then
    echo "✅ Connection test successful"
    
    # Start the MCP server in background
    echo "📡 Starting MCP server..."
    nohup node mcp-vercel.js server > vercel-mcp.log 2>&1 &
    
    # Save the process ID
    echo $! > vercel-mcp.pid
    
    echo "🎉 Vercel MCP is running in background"
    echo "📄 Log file: vercel-mcp.log"
    echo "🆔 PID file: vercel-mcp.pid"
    
    # Show status
    sleep 2
    if ps -p $(cat vercel-mcp.pid) > /dev/null 2>&1; then
        echo "✅ Process is running with PID: $(cat vercel-mcp.pid)"
    else
        echo "❌ Process failed to start"
        exit 1
    fi
else
    echo "❌ Connection test failed"
    exit 1
fi