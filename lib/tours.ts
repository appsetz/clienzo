import { TourStep } from "@/components/PageTour";

export const getDashboardTourSteps = (userType: "freelancer" | "agency"): TourStep[] => {
  if (userType === "agency") {
    return [
      {
        id: "dashboard-overview",
        title: "Welcome to Your Dashboard! 👋",
        description: "This is your agency dashboard. Here you can see all your key metrics at a glance: total clients, active projects, total revenue, and pending payments.",
        target: "[data-tour='dashboard-stats']",
        position: "bottom",
      },
      {
        id: "dashboard-charts",
        title: "Visual Analytics",
        description: "These charts show your project status distribution and payment overview. Use them to quickly understand your business performance.",
        target: "[data-tour='dashboard-charts']",
        position: "bottom",
      },
      {
        id: "dashboard-revenue",
        title: "Revenue Intelligence",
        description: "Track your revenue trends, monthly earnings, and payment analytics. This helps you understand your cash flow and business growth.",
        target: "[data-tour='dashboard-revenue']",
        position: "bottom",
      },
      {
        id: "dashboard-recent-projects",
        title: "Recent Projects",
        description: "Quick access to your most recent projects. Click on any project to view details, add payments, or update status.",
        target: "[data-tour='dashboard-recent-projects']",
        position: "top",
      },
      {
        id: "dashboard-team-section",
        title: "Team Overview",
        description: "See your team members and their recent activity. Manage team payments and assignments from here.",
        target: "[data-tour='dashboard-team']",
        position: "top",
      },
    ];
  }

  return [
    {
      id: "dashboard-overview",
      title: "Welcome to Your Dashboard! 👋",
      description: "This is your dashboard where you can see all your business metrics at a glance: total clients, active projects, total revenue, and pending payments.",
      target: "[data-tour='dashboard-stats']",
      position: "bottom",
    },
    {
      id: "dashboard-charts",
      title: "Visual Analytics",
      description: "These charts show your project status distribution and payment overview. Use them to quickly understand your business performance.",
      target: "[data-tour='dashboard-charts']",
      position: "bottom",
    },
    {
      id: "dashboard-revenue",
      title: "Revenue Intelligence",
      description: "Track your revenue trends, monthly earnings, and payment analytics. This helps you understand your cash flow and business growth.",
      target: "[data-tour='dashboard-revenue']",
      position: "bottom",
    },
    {
      id: "dashboard-recent-projects",
      title: "Recent Projects",
      description: "Quick access to your most recent projects. Click on any project to view details, add payments, or update status.",
      target: "[data-tour='dashboard-recent-projects']",
      position: "top",
    },
  ];
};

export const getClientsTourSteps = (): TourStep[] => {
  return [
    {
      id: "clients-header",
      title: "Manage Your Clients",
      description: "This is your clients page. Here you can view all your clients, add new ones, and manage their information.",
      target: "[data-tour='clients-header']",
      position: "bottom",
    },
    {
      id: "clients-add-button",
      title: "Add a New Client",
      description: "Click this button to add a new client. You'll need to provide their name, email, phone number, and any notes.",
      target: "[data-tour='clients-add-button']",
      position: "left",
      action: () => {
        // Open the add client modal
        const addButton = document.querySelector("[data-tour='clients-add-button']") as HTMLElement;
        if (addButton) {
          setTimeout(() => {
            addButton.click();
          }, 500);
        }
      },
    },
    {
      id: "clients-list",
      title: "Your Clients List",
      description: "All your clients are listed here. Click on a client to view their details, edit their information, or see their projects.",
      target: "[data-tour='clients-list']",
      position: "top",
    },
  ];
};

export const getProjectsTourSteps = (userType: "freelancer" | "agency"): TourStep[] => {
  const baseSteps: TourStep[] = [
    {
      id: "projects-header",
      title: "Manage Your Projects",
      description: "This is your projects page. Here you can create new projects, track their status, set deadlines, and manage project details.",
      target: "[data-tour='projects-header']",
      position: "bottom",
    },
    {
      id: "projects-add-button",
      title: "Create a New Project",
      description: "Click this button to create a new project. You'll need to select a client, enter project name, set the total amount, and optionally add a deadline.",
      target: "[data-tour='projects-add-button']",
      position: "left",
      action: () => {
        // Open the add project modal
        const addButton = document.querySelector("[data-tour='projects-add-button']") as HTMLElement;
        if (addButton) {
          setTimeout(() => {
            addButton.click();
          }, 500);
        }
      },
    },
    {
      id: "projects-list",
      title: "Your Projects List",
      description: "All your projects are listed here. Click on any project to view details, add payments, update status, or generate invoices.",
      target: "[data-tour='projects-list']",
      position: "top",
    },
  ];

  if (userType === "agency") {
    baseSteps.push({
      id: "projects-team-assignment",
      title: "Assign Team Members",
      description: "When creating or editing a project, you can assign up to 3 team members to work on it. This helps track who's responsible for each project.",
      target: "[data-tour='projects-team-assignment']",
      position: "top",
    });
  }

  return baseSteps;
};

export const getPaymentsTourSteps = (): TourStep[] => {
  return [
    {
      id: "payments-header",
      title: "Payment Management",
      description: "This is your payments page. Here you can record payments from clients, track payment history, and generate invoices.",
      target: "[data-tour='payments-header']",
      position: "bottom",
    },
    {
      id: "payments-add-button",
      title: "Record a Payment",
      description: "Click this button to record a new payment. Select the project, enter the amount, date, and payment type (advance, partial, or final).",
      target: "[data-tour='payments-add-button']",
      position: "left",
      action: () => {
        // Open the add payment modal
        const addButton = document.querySelector("[data-tour='payments-add-button']") as HTMLElement;
        if (addButton) {
          setTimeout(() => {
            addButton.click();
          }, 500);
        }
      },
    },
    {
      id: "payments-list",
      title: "Payment History",
      description: "All your recorded payments are listed here. You can see the project, amount, date, and payment type for each transaction.",
      target: "[data-tour='payments-list']",
      position: "top",
    },
    {
      id: "payments-invoice-button",
      title: "Generate Invoice",
      description: "Click the 'Generate Invoice' button on any payment to create a professional invoice. You can download it as PDF or send it to your client.",
      target: "[data-tour='payments-invoice-button']",
      position: "left",
    },
    {
      id: "payments-invoice-location",
      title: "Invoice Location",
      description: "Invoices are generated from the payment details. You can access the invoice generator from the project detail page or directly from the payments list.",
      target: "[data-tour='payments-invoice-location']",
      position: "top",
    },
  ];
};

export const getTeamTourSteps = (): TourStep[] => {
  return [
    {
      id: "team-header",
      title: "Team Management",
      description: "This is your team page. Here you can add team members, manage their information, and track their payments.",
      target: "[data-tour='team-header']",
      position: "bottom",
    },
    {
      id: "team-add-button",
      title: "Add a Team Member",
      description: "Click this button to add a new team member. Enter their name, email, and role. You can add as many team members as needed.",
      target: "[data-tour='team-add-button']",
      position: "left",
      action: () => {
        // Open the add team member modal
        const addButton = document.querySelector("[data-tour='team-add-button']") as HTMLElement;
        if (addButton) {
          setTimeout(() => {
            addButton.click();
          }, 500);
        }
      },
    },
    {
      id: "team-list",
      title: "Your Team Members",
      description: "All your team members are listed here. Click on the dropdown arrow to expand and see their payment history, or click 'Add Payment' to record a salary payment.",
      target: "[data-tour='team-list']",
      position: "top",
    },
    {
      id: "team-payment-button",
      title: "Add Payment for Team Member",
      description: "Click 'Add Payment' next to any team member to record their salary payment. Enter the amount, date, and any notes. You can track the last 6 months of payments.",
      target: "[data-tour='team-payment-button']",
      position: "left",
    },
    {
      id: "team-payments-view",
      title: "View Payment History",
      description: "Expand a team member's row to see their payment history. You can view the last 6 months of payments and click 'View More' to see the full payment analytics page.",
      target: "[data-tour='team-payments-view']",
      position: "top",
    },
  ];
};

