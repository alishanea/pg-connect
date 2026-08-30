import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export async function getPresignedUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const filename = (req.query.filename as string) || 'attachment.jpg';
    const ext = filename.split('.').pop() || 'jpg';
    const key = `grievances/${Date.now()}-${randomUUID()}.${ext}`;

    // For local dev/demo environment: construct mock presigned upload URL & target photo URL
    const uploadUrl = `http://localhost:${process.env.PORT || 4000}/api/v1/uploads/mock-put/${key}`;
    const photoUrl = `http://localhost:${process.env.PORT || 4000}/uploads/${key}`;

    return res.json({
      uploadUrl,
      photoUrl,
      key,
    });
  } catch (err) {
    next(err);
  }
}
