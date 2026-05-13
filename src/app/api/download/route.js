// src/app/api/download/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('name') || 'academic-resource.pdf';

    if (!fileUrl) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    try {
        const response = await fetch(fileUrl);

        if (!response.ok) throw new Error('Cloudinary rejected the request');

        const data = await response.arrayBuffer();

        return new NextResponse(data, {
            headers: {
                'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}