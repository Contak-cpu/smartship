#!/bin/bash

# Vercel MCP Stop Script
# This script stops the Vercel MCP server

echo "🛑 Stopping Vercel MCP Connection..."

# Check if PID file exists
if [ -f "vercel-mcp.pid" ]; then
    PID=$(cat vercel-mcp.pid)
    
    # Check if process is running
    if ps -p $PID > /dev/null 2>&1; then
        echo "🔄 Stopping process $PID..."
        kill $PID
        
        # Wait for process to stop
        sleep 2
        
        if ps -p $PID > /dev/null 2>&1; then
            echo "⚠️  Process didn't stop gracefully, forcing..."
            kill -9 $PID
        fi
        
        echo "✅ Process stopped"
    else
        echo "ℹ️  Process was not running"
    fi
    
    # Clean up PID file
    rm -f vercel-mcp.pid
else
    echo "ℹ️  No PID file found"
fi

# Clean up any remaining processes
pkill -f "mcp-vercel.js server" 2>/dev/null || true

echo "🎯 Vercel MCP stopped"