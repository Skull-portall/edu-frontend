import Loader from "../../components/common/Loader";
import React from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { data, isLoading: loading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const response = await adminAPI.getStats();
      return response.data.data;
    },
  });

  const stats = data || {};
  const pendingCounts = data?.pendingCounts || {};

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <Loader />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.users || 0,
      icon: "users",
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Questions",
      value: stats?.questions || 0,
      icon: "chat",
      color: "bg-red-50 text-red-600",
    },
    {
      label: "Courses",
      value: stats?.courses || 0,
      icon: "book",
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Semesters",
      value: stats?.semesters || 0,
      icon: "calendar",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Departments",
      value: stats?.departments || 0,
      icon: "office",
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Campuses",
      value: stats?.campuses || 0,
      icon: "location",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const getIcon = (name) => {
    switch (name) {
      case "users":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 4.354l1.108 2.246 2.477.359-1.791 1.747.423 2.467L12 9.92l-2.217 1.153.423-2.467-1.791-1.747 2.477-.359L12 4.354z"
          />
        );
      case "chat":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        );
      case "book":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        );
      case "calendar":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        );
      case "office":
        return (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        );
      case "location":
        return (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </>
        );
      default:
        return null;
    }
  };

  const sections = [
    {
      title: "Content & Academic Moderation",
      description: "Review shared notes, past exam papers, topics, and student communities",
      modules: [
        {
          to: "/admin/notes",
          title: "Study Notes",
          desc: "Review and approve notes uploaded by students.",
          countKey: "pendingNotes",
          countLabel: "Pending",
          iconColor: "text-blue-600 bg-blue-50",
        },
        {
          to: "/admin/pass-tests",
          title: "Past Papers & Tests",
          desc: "Moderate exam papers, past tests, and assignments.",
          countKey: "pendingPassTests",
          countLabel: "Pending",
          iconColor: "text-amber-600 bg-amber-50",
        },
        {
          to: "/admin/communities",
          title: "Communities",
          desc: "Manage discussion circles and active groups.",
          countKey: "inactiveCommunities",
          countLabel: "New",
          iconColor: "text-emerald-600 bg-emerald-50",
        },
        {
          to: "/admin/topics",
          title: "Forum Topics",
          desc: "Curate categories and global academic topics.",
          iconColor: "text-purple-600 bg-purple-50",
        },
      ],
    },
    {
      title: "Campus Hub Marketplace",
      description: "Oversee service provider verification, listings, and transaction chats",
      modules: [
        {
          to: "/admin/campus-hub/applications",
          title: "Provider Applications",
          desc: "Approve or decline student service provider requests.",
          countKey: "pendingProviderApplications",
          countLabel: "Pending",
          iconColor: "text-red-600 bg-red-50",
        },
        {
          to: "/admin/campus-hub/services",
          title: "Service Listings",
          desc: "Monitor published marketplace listings and pricing.",
          iconColor: "text-emerald-600 bg-emerald-50",
        },
        {
          to: "/admin/campus-hub/orders",
          title: "Service Orders",
          desc: "Track completed, pending, and disputed orders.",
          iconColor: "text-blue-600 bg-blue-50",
        },
        {
          to: "/admin/campus-hub/chats",
          title: "Order Chats",
          desc: "Audit conversations between buyers and providers.",
          iconColor: "text-amber-600 bg-amber-50",
        },
      ],
    },
    {
      title: "Users & Institutional Structure",
      description: "Configure academic campuses, departments, course catalog, and user accounts",
      modules: [
        {
          to: "/admin/users",
          title: "User Directory",
          desc: "Inspect student accounts, ban/unban, and permissions.",
          countKey: "newUsers",
          countLabel: "New",
          iconColor: "text-blue-600 bg-blue-50",
        },
        {
          to: "/admin/management",
          title: "Administrators",
          desc: "Manage Super, Campus, and Department Admin roles.",
          iconColor: "text-purple-600 bg-purple-50",
        },
        {
          to: "/admin/class-reps",
          title: "Class Representatives",
          desc: "Assign official class reps for departments & levels.",
          iconColor: "text-emerald-600 bg-emerald-50",
        },
        {
          to: "/admin/campuses",
          title: "Campuses",
          desc: "Manage physical and virtual campus locations.",
          iconColor: "text-gray-800 bg-gray-100",
        },
        {
          to: "/admin/departments",
          title: "Departments",
          desc: "Organize faculties, schools, and academic divisions.",
          iconColor: "text-amber-600 bg-amber-50",
        },
        {
          to: "/admin/courses",
          title: "Courses Catalog",
          desc: "Create and update course codes and semester outlines.",
          iconColor: "text-red-600 bg-red-50",
        },
        {
          to: "/admin/semesters",
          title: "Semesters",
          desc: "Define academic terms, levels, and school years.",
          iconColor: "text-blue-600 bg-blue-50",
        },
        {
          to: "/admin/onboarding-feedback",
          title: "Student Feedback",
          desc: "Review onboarding satisfaction responses.",
          iconColor: "text-emerald-600 bg-emerald-50",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {/* ── Page Header ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider rounded">
                Admin Center
              </span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-gray-500">Live Control</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900">
              Admin <span className="text-red-600">Dashboard</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Platform statistics, academic moderation, and system settings
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/end-season"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-xs transition"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Semester Rollover
            </Link>
          </div>
        </div>

        {/* ── 6 Compact Stat Cards ─────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-xs flex items-center gap-3"
            >
              <div
                className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center shrink-0`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {getIcon(card.icon)}
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 truncate">
                  {card.label}
                </p>
                <p className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                  {card.value.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Semester Rollover Operation Banner ─────────────────────────────── */}
        <div className="bg-gray-900 rounded-xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Academic Semester Rollover
                </h3>
                <span className="px-1.5 py-0.2 bg-red-600/40 text-red-300 rounded text-[9px] font-bold uppercase">
                  Batch Action
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Advance all enrolled students to their next academic level and promote semester progression.
              </p>
            </div>
          </div>

          <Link
            to="/admin/end-season"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-xs uppercase tracking-wider transition shrink-0"
          >
            Manage Rollover →
          </Link>
        </div>

        {/* ── Categorized Admin Control Nodes ─────────────────────────────── */}
        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="mb-3">
                <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">
                  {section.title}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {section.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {section.modules.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group bg-white rounded-xl border border-gray-100 p-4 shadow-xs hover:border-red-200 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconColor}`}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>

                        {item.countKey && pendingCounts?.[item.countKey] > 0 && (
                          <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-bold shadow-xs">
                            {pendingCounts[item.countKey]} {item.countLabel}
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm text-gray-900 group-hover:text-red-600 transition-colors mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>

                    <div className="flex items-center text-[11px] font-bold text-gray-400 group-hover:text-red-600 transition-colors pt-2 border-t border-gray-50">
                      <span>Manage Node</span>
                      <svg
                        className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
