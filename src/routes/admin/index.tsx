import { createFileRoute, redirect } from '@tanstack/react-router'

// prevent user from navigating to
export const Route = createFileRoute('/admin/')({
    beforeLoad: () => {
        throw redirect({ to: '/admin/dashboard' })
    },
})