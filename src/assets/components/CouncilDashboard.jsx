import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart3, CheckCircle, Clock, FileText, MapPin, AlertTriangle } from 'lucide-react';
import MapView from './MapView';

export default function CouncilDashboard({ user }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState({
    submitted: 0,
    inReview: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    // Subscribe to reports in real-time
    const q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(reportsData);

      // Calculate stats
      const submitted = reportsData.filter(r => r.status === 'Submitted').length;
      const inReview = reportsData.filter(r => r.status === 'In Review').length;
      const resolved = reportsData.filter(r => r.status === 'Resolved').length;

      setStats({
        submitted,
        inReview,
        resolved,
        total: reportsData.length
      });

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (reportId, newStatus) => {
    setUpdating(true);
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        reviewedAt: newStatus === 'In Review' ? new Date().toISOString() : undefined,
        resolvedAt: newStatus === 'Resolved' ? new Date().toISOString() : undefined
      });

      alert(`Report status updated to: ${newStatus}`);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 1: return 'text-green-600 bg-green-50';
      case 2: return 'text-yellow-600 bg-yellow-50';
      case 3: return 'text-orange-600 bg-orange-50';
      case 4: return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading council dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Council Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-gray-600" />
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-600">Total Reports</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{stats.submitted}</span>
            </div>
            <p className="text-sm text-gray-600">Submitted</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{stats.inReview}</span>
            </div>
            <p className="text-sm text-gray-600">In Review</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{stats.resolved}</span>
            </div>
            <p className="text-sm text-gray-600">Resolved</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Reports List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Reports</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedReport?.id === report.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{report.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                      report.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{report.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded ${getSeverityColor(report.severity)}`}>
                      Severity: {report.severity}
                    </span>
                    <span>{formatDate(report.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Details */}
          <div className="bg-white rounded-lg shadow p-6">
            {selectedReport ? (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Report Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{selectedReport.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedReport.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <p className="text-gray-600 mt-1">
                        {selectedReport.category?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Severity:</span>
                      <p className={`mt-1 inline-block px-2 py-1 rounded ${getSeverityColor(selectedReport.severity)}`}>
                        Level {selectedReport.severity}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <p className="text-gray-600 mt-1">{selectedReport.status}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Submitted:</span>
                      <p className="text-gray-600 mt-1">{formatDate(selectedReport.createdAt)}</p>
                    </div>
                  </div>

                  {selectedReport.coords && (
                    <div>
                      <span className="font-medium text-gray-700 flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Location:</span>
                      </span>
                      <p className="text-gray-600 mt-1">
                        {selectedReport.coords.latitude.toFixed(6)}, {selectedReport.coords.longitude.toFixed(6)}
                      </p>
                      <div className="h-48 mt-2 rounded-lg overflow-hidden border">
                        <MapView selectedLocation={{
                          lat: selectedReport.coords.latitude,
                          lng: selectedReport.coords.longitude
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Status Update Actions */}
                  {selectedReport.status !== 'Resolved' && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-gray-700 mb-3">Update Status:</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.status !== 'In Review' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedReport.id, 'In Review')}
                            disabled={updating}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                          >
                            Mark In Review
                          </button>
                        )}
                        <button
                          onClick={() => handleStatusUpdate(selectedReport.id, 'Resolved')}
                          disabled={updating}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedReport.id, 'Archived')}
                          disabled={updating}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="h-16 w-16 mb-4" />
                <p>Select a report to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
