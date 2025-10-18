import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { AfipMCPConnector } from '../components/AfipMCPConnector';

const AfipMCPPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                Integración AFIP MCP
              </h1>
              <p className="mt-2 text-gray-600">
                Conecta y gestiona servicios de AFIP a través del Model Context Protocol
              </p>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg">
              <AfipMCPConnector 
                onConnectionChange={(connected) => {
                  console.log('Estado de conexión AFIP MCP:', connected);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AfipMCPPage;