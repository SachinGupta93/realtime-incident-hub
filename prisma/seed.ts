import { PrismaClient, Role, Severity, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...\n');

    // ── Users ────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@incident-hub.com' },
        update: {},
        create: {
            name: 'Alice Admin',
            email: 'admin@incident-hub.com',
            passwordHash,
            role: Role.ADMIN,
        },
    });

    const responder1 = await prisma.user.upsert({
        where: { email: 'bob@incident-hub.com' },
        update: {},
        create: {
            name: 'Bob Responder',
            email: 'bob@incident-hub.com',
            passwordHash,
            role: Role.RESPONDER,
        },
    });

    const responder2 = await prisma.user.upsert({
        where: { email: 'carol@incident-hub.com' },
        update: {},
        create: {
            name: 'Carol Responder',
            email: 'carol@incident-hub.com',
            passwordHash,
            role: Role.RESPONDER,
        },
    });

    const viewer = await prisma.user.upsert({
        where: { email: 'dave@incident-hub.com' },
        update: {},
        create: {
            name: 'Dave Viewer',
            email: 'dave@incident-hub.com',
            passwordHash,
            role: Role.VIEWER,
        },
    });

    console.log('✅ Users created:');
    console.log(`   Admin:     ${admin.email}`);
    console.log(`   Responder: ${responder1.email}`);
    console.log(`   Responder: ${responder2.email}`);
    console.log(`   Viewer:    ${viewer.email}`);
    console.log(`   Password:  password123 (all users)\n`);

    // ── Incidents ────────────────────────────────────────────
    const incidents = [
        {
            title: 'Production database connection pool exhausted',
            description: 'The primary PostgreSQL database is rejecting new connections. Connection pool limit of 100 has been reached. Multiple services are returning 500 errors. Immediate investigation needed.',
            severity: Severity.CRITICAL,
            status: Status.IN_PROGRESS,
            createdById: admin.id,
            assignedToId: responder1.id,
        },
        {
            title: 'Authentication service returning 503',
            description: 'Users are unable to log in. The authentication microservice is returning 503 Service Unavailable. Load balancer health checks are failing. Affects all users.',
            severity: Severity.CRITICAL,
            status: Status.OPEN,
            createdById: responder1.id,
            assignedToId: null,
        },
        {
            title: 'Memory leak in payment processing worker',
            description: 'The payment processing worker pod is consuming increasing amounts of memory over time. Currently at 3.2GB and climbing. Pod restarts every ~4 hours. Need to identify the leak source.',
            severity: Severity.HIGH,
            status: Status.IN_PROGRESS,
            createdById: admin.id,
            assignedToId: responder2.id,
        },
        {
            title: 'CDN cache invalidation not propagating',
            description: 'After deploying new assets, CDN cache invalidation requests are not propagating to all edge locations. Some users are seeing stale CSS/JS. Cloudflare dashboard shows pending invalidations.',
            severity: Severity.HIGH,
            status: Status.RESOLVED,
            createdById: responder1.id,
            assignedToId: responder1.id,
        },
        {
            title: 'Elevated error rates on API gateway',
            description: 'API gateway is showing 5% error rate (normally <0.1%). Most errors are timeouts to downstream services. Started after the v2.14 deployment. May need rollback.',
            severity: Severity.HIGH,
            status: Status.OPEN,
            createdById: responder2.id,
            assignedToId: null,
        },
        {
            title: 'Email notification delays exceeding 30 minutes',
            description: 'Transactional emails (password resets, order confirmations) are being delayed by 30+ minutes. SQS queue depth is growing. Lambda concurrency may be throttled.',
            severity: Severity.MEDIUM,
            status: Status.IN_PROGRESS,
            createdById: admin.id,
            assignedToId: responder1.id,
        },
        {
            title: 'SSL certificate expiring in 7 days',
            description: 'The wildcard SSL certificate for *.example.com expires on March 5th. Auto-renewal via Let\'s Encrypt failed due to DNS challenge timeout. Manual intervention needed.',
            severity: Severity.MEDIUM,
            status: Status.OPEN,
            createdById: responder2.id,
            assignedToId: null,
        },
        {
            title: 'Disk space warning on log aggregator',
            description: 'The centralized logging server is at 82% disk usage. At current ingestion rate, it will reach 95% within 5 days. Need to increase retention rotation or add storage.',
            severity: Severity.MEDIUM,
            status: Status.RESOLVED,
            createdById: responder1.id,
            assignedToId: responder2.id,
        },
        {
            title: 'Stripe webhook endpoint returning 400 errors',
            description: 'About 3% of Stripe webhook deliveries are failing with 400 Bad Request. Looks like a schema mismatch after Stripe\'s API version update. Payments still processing but reconciliation is incomplete.',
            severity: Severity.HIGH,
            status: Status.OPEN,
            createdById: admin.id,
            assignedToId: responder1.id,
        },
        {
            title: 'Kubernetes node NotReady in us-east-1b',
            description: 'Worker node ip-10-0-42-196 in us-east-1b has been in NotReady state for 15 minutes. kubelet is unresponsive. 8 pods were evicted. Cluster autoscaler is provisioning replacement.',
            severity: Severity.HIGH,
            status: Status.CLOSED,
            createdById: responder1.id,
            assignedToId: responder1.id,
        },
        {
            title: 'Minor UI alignment issue on settings page',
            description: 'The "Save" button on the user settings page is slightly misaligned on mobile Safari. Low priority cosmetic issue reported by 2 users.',
            severity: Severity.LOW,
            status: Status.OPEN,
            createdById: viewer.id,
            assignedToId: null,
        },
        {
            title: 'Update Node.js runtime to v22 LTS',
            description: 'We are currently running Node.js v20. The v22 LTS release has been out for 6 months. Should plan an upgrade for better performance and security patches.',
            severity: Severity.LOW,
            status: Status.OPEN,
            createdById: admin.id,
            assignedToId: null,
        },
        {
            title: 'Redis cluster failover completed with data loss',
            description: 'The Redis cluster in ap-south-1 experienced a primary node failure. Automatic failover promoted a replica, but approximately 30 seconds of writes were lost. Session data for ~200 users was affected.',
            severity: Severity.CRITICAL,
            status: Status.RESOLVED,
            createdById: admin.id,
            assignedToId: responder2.id,
        },
        {
            title: 'Third-party geocoding API rate limit reached',
            description: 'Our Google Maps Geocoding API quota was exceeded. Location-based features are returning fallback data. Need to either increase quota or implement better caching.',
            severity: Severity.MEDIUM,
            status: Status.IN_PROGRESS,
            createdById: responder2.id,
            assignedToId: responder2.id,
        },
        {
            title: 'Deprecation warning in CI pipeline',
            description: 'GitHub Actions is showing deprecation warnings for actions/checkout@v3 and actions/setup-node@v3. Should update to v4 before they stop working.',
            severity: Severity.LOW,
            status: Status.CLOSED,
            createdById: responder1.id,
            assignedToId: responder1.id,
        },
    ];

    let created = 0;
    for (const incident of incidents) {
        const existing = await prisma.incident.findFirst({
            where: { title: incident.title },
        });
        if (!existing) {
            await prisma.incident.create({ data: incident });
            created++;
        }
    }
    console.log(`✅ Incidents: ${created} created (${incidents.length - created} already existed)\n`);

    // ── Audit Logs for seeded incidents ──────────────────────
    const allIncidents = await prisma.incident.findMany();
    let auditCreated = 0;
    for (const inc of allIncidents) {
        const existing = await prisma.auditLog.findFirst({
            where: { entityId: inc.id, action: 'CREATE' },
        });
        if (!existing) {
            await prisma.auditLog.create({
                data: {
                    action: 'CREATE',
                    entityType: 'Incident',
                    entityId: inc.id,
                    userId: inc.createdById,
                    metadata: { seeded: true },
                },
            });
            auditCreated++;
        }
    }
    console.log(`✅ Audit logs: ${auditCreated} created\n`);
    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
