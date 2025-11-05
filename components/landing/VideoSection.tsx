import React from 'react'

export function VideoSection() {
  const videos = [
    {
      id: '5kx6og3y1-g',
      url: 'https://www.youtube.com/watch?v=5kx6og3y1-g&t=80s',
      title: 'Como pasar de $9.000 a $5.000 de costo por envío en Andreani - Ecommerce con Tiendanube o Shopify',
      thumbnail: 'https://img.youtube.com/vi/5kx6og3y1-g/maxresdefault.jpg',
    },
    {
      id: 'p1HX-l5iz-A',
      url: 'https://www.youtube.com/watch?v=p1HX-l5iz-A',
      title: 'Como usar Fácil Uno en Shopify - Ahorra +$3000 por envío',
      thumbnail: 'https://img.youtube.com/vi/p1HX-l5iz-A/maxresdefault.jpg',
    },
    {
      id: 'bbvuHSh1Wrc',
      url: 'https://www.youtube.com/watch?v=bbvuHSh1Wrc',
      title: 'Como agregar el SKU en tus etiquetas de Andreani / Correo - Ahorra tiempo y esfuerzo con Fácil Uno',
      thumbnail: 'https://img.youtube.com/vi/bbvuHSh1Wrc/maxresdefault.jpg',
    },
  ]

  return (
    <section className="py-8 sm:py-12 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white mb-3">
              ¿Querés saber cómo usar facil.uno?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {videos.map((video) => (
              <a
                key={video.id}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="relative aspect-video bg-gray-200">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback a hqdefault si maxresdefault no existe
                      const target = e.target as HTMLImageElement
                      target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    YouTube
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

