import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import axios from 'axios';

const SERVICE_MAP = {
  rooms: 'http://localhost:4001',
  services: 'http://localhost:4002',
  finance: 'http://localhost:4004',
  movies: 'http://localhost:4005',
  venues: 'http://localhost:4007',
};

@Controller()
export class ProxyController {
  @All(['rooms/*', 'services/*', 'finance/*', 'movies/*', 'venues/*'])
  async proxyRequest(@Req() req: Request, @Res() res: Response) {
    try {
      const path = req.path;
      const serviceName = path.split('/')[1] as keyof typeof SERVICE_MAP;
      const serviceUrl = SERVICE_MAP[serviceName];

      if (!serviceUrl) {
        return res.status(404).json({ message: 'Service not found' });
      }

      // Keep the full path after the service name (e.g., /rooms/vendor/room-types -> /vendor/room-types)
      const targetPath = path.substring(serviceName.length + 1); // removes "/rooms" part
      const queryString = Object.keys(req.query).length > 0
        ? '?' + new URLSearchParams(req.query as any).toString()
        : '';
      const targetUrl = `${serviceUrl}${targetPath}${queryString}`;

      console.log(`[Gateway] ${req.method} ${path} -> ${targetUrl}`);

      const response = await axios({
        method: req.method,
        url: targetUrl,
        data: req.body,
        headers: {
          'content-type': req.headers['content-type'] || 'application/json',
        },
        validateStatus: () => true,
      });

      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Proxy error:', error.message);
      res.status(500).json({
        message: 'Gateway proxy error',
        error: error.message
      });
    }
  }
}
