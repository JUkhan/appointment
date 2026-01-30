import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToggle,
  IonAlert,
  IonToast,
  IonButtons,
  IonMenuButton,
  IonSearchbar,
} from '@ionic/react';
import {
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  peopleOutline,
} from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { CLIENT_ID } from '../constants/api';
import type { DataUser, GetClientUsersResponse } from '../types';

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<DataUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DataUser[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle confirmation
  const [showAlert, setShowAlert] = useState(false);
  const [selectedUser, setSelectedUser] = useState<DataUser | null>(null);
  const [pendingToggleValue, setPendingToggleValue] = useState(false);

  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');

  useEffect(() => {
    fetchClientUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users]);

  const fetchClientUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const clientId = await storageService.getItem(CLIENT_ID);

      if (!clientId) {
        setError('Client ID not found');
        return;
      }

      const response: GetClientUsersResponse = await apiService.getClientUsers(clientId);

      setUsers(response.users);
      setClientName(response.client_name);
      setTotalUsers(response.total_users);

    } catch (err: any) {
      console.error('Error fetching client users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      user.id.toString().includes(query)
    );
    setFilteredUsers(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await fetchClientUsers();
    event.detail.complete();
  };

  const handleToggleClick = (user: DataUser, newValue: boolean) => {
    setSelectedUser(user);
    setPendingToggleValue(newValue);
    setShowAlert(true);
  };

  const confirmToggleActiveStatus = async () => {
    if (!selectedUser) return;

    try {
      await apiService.updateDataUser(selectedUser.id, {
        is_active: pendingToggleValue,
      });

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === selectedUser.id
            ? { ...u, is_active: pendingToggleValue }
            : u
        )
      );

      setToastMessage(
        `User "${selectedUser.username}" ${pendingToggleValue ? 'activated' : 'deactivated'} successfully`
      );
      setToastColor('success');
      setShowToast(true);

    } catch (err: any) {
      console.error('Error updating user:', err);
      setToastMessage(err.response?.data?.error || 'Failed to update user status');
      setToastColor('danger');
      setShowToast(true);
    } finally {
      setShowAlert(false);
      setSelectedUser(null);
    }
  };

  const getRoleBadgeColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'danger';
      case 'doctor':
        return 'warning';
      case 'receptionist':
        return 'tertiary';
      case 'patient':
      case 'user':
        return 'primary';
      default:
        return 'medium';
    }
  };

  const getActiveUsersCount = () => users.filter(u => u.is_active).length;
  const getInactiveUsersCount = () => users.filter(u => !u.is_active).length;
  const getRoleCount = (role: string) => users.filter(u => u.role === role).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Manage Users</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Pull to refresh */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <IonSpinner name="crescent" />
            <p>Loading users...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <IonCard color="danger">
            <IonCardContent>
              <p>{error}</p>
              <IonButton expand="block" onClick={fetchClientUsers}>
                Retry
              </IonButton>
            </IonCardContent>
          </IonCard>
        )}

        {/* Success State */}
        {!isLoading && !error && (
          <>
            {/* Client Info Card */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                  {clientName}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>
                  <strong>Total Users:</strong> {totalUsers}
                </p>
              </IonCardContent>
            </IonCard>

            {/* Search Bar */}
            <div style={{ padding: '0 16px' }}>
              <IonSearchbar
                value={searchQuery}
                onIonInput={(e) => setSearchQuery(e.detail.value!)}
                placeholder="Search by username, role, or ID"
                debounce={300}
              />
            </div>

            {/* Users List */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  Users ({filteredUsers.length})
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {filteredUsers.length === 0 ? (
                  <p>
                    {searchQuery ? 'No users found matching your search.' : 'No users found for this client.'}
                  </p>
                ) : (
                  <IonList>
                    {filteredUsers.map((user) => (
                      <IonItem key={user.id}>
                        <IonIcon icon={personOutline} slot="start" />
                        <IonLabel>
                          <h2>
                            <strong>{user.username}</strong>
                          </h2>
                          <p>ID: {user.id}</p>
                          <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                        </IonLabel>
                        <div slot="end" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <IonBadge color={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </IonBadge>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <IonLabel style={{ fontSize: '12px' }}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </IonLabel>
                            <IonToggle
                              checked={user.is_active}
                              onIonChange={(e) => handleToggleClick(user, e.detail.checked)}
                              color={user.is_active ? 'success' : 'medium'}
                            />
                          </div>
                        </div>
                      </IonItem>
                    ))}
                  </IonList>
                )}
              </IonCardContent>
            </IonCard>

            {/* User Statistics */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Statistics</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonList>
                  <IonItem>
                    <IonIcon icon={peopleOutline} slot="start" />
                    <IonLabel>Total Users</IonLabel>
                    <IonBadge slot="end">{users.length}</IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={checkmarkCircleOutline} slot="start" color="success" />
                    <IonLabel>Active Users</IonLabel>
                    <IonBadge slot="end" color="success">
                      {getActiveUsersCount()}
                    </IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonIcon icon={closeCircleOutline} slot="start" color="medium" />
                    <IonLabel>Inactive Users</IonLabel>
                    <IonBadge slot="end" color="medium">
                      {getInactiveUsersCount()}
                    </IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Admins</IonLabel>
                    <IonBadge slot="end" color="danger">
                      {getRoleCount('admin')}
                    </IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Doctors</IonLabel>
                    <IonBadge slot="end" color="warning">
                      {getRoleCount('doctor')}
                    </IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Patients/Users</IonLabel>
                    <IonBadge slot="end" color="primary">
                      {getRoleCount('patient') + getRoleCount('user')}
                    </IonBadge>
                  </IonItem>
                  <IonItem>
                    <IonLabel>Receptionists</IonLabel>
                    <IonBadge slot="end" color="tertiary">
                      {getRoleCount('receptionist')}
                    </IonBadge>
                  </IonItem>
                </IonList>
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* Confirmation Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Confirm Action"
          message={
            selectedUser
              ? `Are you sure you want to ${pendingToggleValue ? 'activate' : 'deactivate'} user "${selectedUser.username}"?`
              : ''
          }
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowAlert(false),
            },
            {
              text: 'Confirm',
              role: 'confirm',
              handler: confirmToggleActiveStatus,
            },
          ]}
        />

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ManageUsersPage;
