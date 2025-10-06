'use client';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User, TimeLog, Signature, Role } from '@/lib/types';
import { useMemo } from 'react';

// Register fonts safely
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa3ZL7.woff2', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 10,
  },
  logo: { width: 80 },
  headerText: { textAlign: 'right' },
  companyName: { fontSize: 14, fontWeight: 600 },
  documentTitle: { fontSize: 12, marginTop: 2, color: '#6B7280' },
  section: { marginBottom: 15 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 4,
  },
  userInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  infoField: { flexDirection: 'column' },
  infoLabel: { fontSize: 9, color: '#6B7280' },
  infoValue: { fontWeight: 500 },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: { flexDirection: 'row', backgroundColor: '#F9FAFB' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F3F4F6' },
  tableCol: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    justifyContent: 'center',
    padding: 5,
  },
  tableCell: { fontSize: 9 },
  tableHeaderCell: { fontSize: 9, fontWeight: 'bold' },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  signatureSection: { marginTop: 10, textAlign: 'left' },
  signatureText: { fontSize: 9, fontStyle: 'italic', color: '#4B5563' },
});

interface ProcessedDay {
  date: string;
  logs: {
    clock_in?: string;
    break_start?: string;
    break_end?: string;
    clock_out?: string;
  };
  totalHours: string;
}

const processLogsForPDF = (logs: TimeLog[]): ProcessedDay[] => {
  if (!logs || logs.length === 0) return [];
  const dailyLogsMap: Record<string, ProcessedDay> = {};

  logs.forEach((log) => {
    if (!log?.timestamp || !isValid(parseISO(log.timestamp))) return;
    const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
    if (!dailyLogsMap[date]) {
      dailyLogsMap[date] = { date, logs: {}, totalHours: 'N/A' };
    }
    if (log.action && typeof log.action === 'string') {
      (dailyLogsMap[date].logs as any)[log.action] = log.timestamp;
    }
  });

  return Object.values(dailyLogsMap)
    .map((day) => {
      const { clock_in, clock_out } = day.logs || {};
      if (clock_in && clock_out && isValid(parseISO(clock_in)) && isValid(parseISO(clock_out))) {
        const diff = parseISO(clock_out).getTime() - parseISO(clock_in).getTime();
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        day.totalHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      return day;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

const getRoleName = (role: Role) => {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'supervisor':
      return 'Supervisor';
    case 'collaborator':
      return 'Colaborador';
    default:
      return role || 'Não definido';
  }
};

interface TimeSheetDocumentProps {
  user: User;
  logs: TimeLog[];
  signature: Signature | null;
}

export function TimeSheetDocument({ user, logs, signature }: TimeSheetDocumentProps) {
  const safeUser = user || { name: 'Usuário não definido', email: '-', role: 'collaborator' };
  const monthYear = format(new Date(), 'MMMM de yyyy', { locale: ptBR });
  const dailyLogs = useMemo(() => processLogsForPDF(logs || []), [logs]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image
            style={styles.logo}
            src="https://firebasestorage.googleapis.com/v0/b/studio-2096480918-e97c7.appspot.com/o/logo.png?alt=media"
          />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>Bit Segurança</Text>
            <Text style={styles.documentTitle}>Folha de Ponto - {monthYear}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Colaborador</Text>
          <View style={styles.userInfo}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{safeUser.name}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{safeUser.email}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Função</Text>
              <Text style={styles.infoValue}>{getRoleName(safeUser.role as Role)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registros de Ponto</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow} fixed>
              {['Data', 'Dia', 'Entrada', 'Início Pausa', 'Fim Pausa', 'Saída'].map((header) => (
                <View key={header} style={styles.tableCol}>
                  <Text style={styles.tableHeaderCell}>{header}</Text>
                </View>
              ))}
            </View>

            {dailyLogs.length > 0 ? (
              dailyLogs.map((day) => (
                <View key={day.date} style={styles.tableRow}>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {isValid(parseISO(day.date)) ? format(parseISO(day.date), 'dd/MM/yyyy') : '-'}
                    </Text>
                  </View>
                  <View style={styles.tableCol}>
                    <Text style={styles.tableCell}>
                      {isValid(parseISO(day.date))
                        ? format(parseISO(day.date), 'EEEE', { locale: ptBR })
                        : '-'}
                    </Text>
                  </View>

                  {(['clock_in', 'break_start', 'break_end', 'clock_out'] as const).map((key) => (
                    <View key={key} style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {day.logs[key] && isValid(parseISO(day.logs[key]!))
                          ? format(parseISO(day.logs[key]!), 'HH:mm:ss')
                          : '-'}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <View style={{ ...styles.tableCol, width: '100%' }}>
                  <Text style={styles.tableCell}>Nenhum registro para este mês.</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer} fixed>
          {signature && signature.signedAt && isValid(parseISO(signature.signedAt)) ? (
            <View style={styles.signatureSection}>
              <Text style={styles.signatureText}>
                Assinado digitalmente por {safeUser.name} em{' '}
                {format(parseISO(signature.signedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}.
              </Text>
              <Text style={styles.signatureText}>
                Este documento confirma a veracidade das informações registradas.
              </Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 10 }}>
            Gerado por Bit Segurança - Sistema de Ponto Eletrônico
          </Text>
        </View>
      </Page>
    </Document>
  );
}
